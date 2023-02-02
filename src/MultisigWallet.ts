import { TonClient } from "ton"
import { keyPairFromSecretKey, sign } from "ton-crypto"
import { Address, beginCell, Cell, contractAddress, Dictionary, external, Message, Slice, StateInit } from "ton-core"
import { Order } from "./Order"

const MULTISIG_CODE = Cell.fromBase64('te6cckECKwEABBgAART/APSkE/S88sgLAQIBIAIDAgFIBAUE2vIgxwCOgzDbPOCDCNcYIPkBAdMH2zwiwAAToVNxePQOb6Hyn9s8VBq6+RDyoAb0BCD5AQHTH1EYuvKq0z9wUwHwCgHCCAGDCryx8mhTFYBA9A5voSCYDqQgwgryZw7f+COqH1NAufJhVCOjU04gIyEiAgLMBgcCASAMDQIBIAgJAgFmCgsAA9GEAiPymAvHoHN9CYbZ5S7Z4BPHohwhJQAtAKkItdJEqCTItdKlwLUAdAT8ArobBKAATwhbpEx4CBukTDgAdAg10rDAJrUAvALyFjPFszJ4HHXI8gBzxb0AMmACASAODwIBIBQVARW77ZbVA0cFUg2zyCoCAUgQEQIBIBITAXOxHXQgwjXGCD5AQHTB4IB1MTtQ9hTIHj0Dm+h8p/XC/9eMfkQ8qCuAfQEIW6TW3Ey4PkBWNs8AaQBgJwA9rtqA6ADoAPoCAXoCEfyAgPyA3XlP+AXkegAA54tkwAAXrhlXP8EA1WZ2oexAAgEgFhcCASAYGQFRtyVbZ4YmRmpGEAgegc30McJNhFpAADMaYeYuAFrgJhwLb+4cC3d0bhAjAYm1WZtnhqvgb+2xxsoicAgej430pBHEoFpAADHDhBACGuQkuuBk9kUWE5kAOeLKhACQCB6IYFImHFImHFImXEA2YlzNijAjAgEgGhsAF7UGtc4QQDVZnah7EAIBIBwdAgOZOB4fARGsGm2eL4G2CUAjABWt+UEAzJV2oewYQAENqTbPBVfBYCMAFa3f3CCAarM7UPYgAiDbPALyZfgAUENxQxPbPO1UIyoACtP/0wcwBKDbPC+uUyCw8mISsQKkJbNTHLmwJYEA4aojoCi8sPJpggGGoPgBBZcCERACPj4wjo0REB/bPEDXePRDEL0F4lQWW1Rz51YQU9zbPFRxClR6vCQlKCYAIO1E0NMf0wfTB9M/9AT0BNEAXgGOGjDSAAHyo9MH0wdQA9cBIPkBBfkBFbrypFAD4GwhIddKqgIi10m68qtwVCATAAwByMv/ywcE1ts87VT4D3AlblOJvrGYEG4QLVDHXwePGzBUJANQTds8UFWgRlAQSRA6SwlTuds8UFQWf+L4AAeDJaGOLCaAQPSWb6UglDBTA7neII4WODk5CNIAAZfTBzAW8AcFkTDifwgHBZJsMeKz5jAGKicoKQBgcI4pA9CDCNcY0wf0BDBTFnj0Dm+h8qXXC/9URUT5EPKmrlIgsVIDvRShI27mbCIyAH5SML6OIF8D+ACTItdKmALTB9QC+wAC6DJwyMoAQBSAQPRDAvAHjhdxyMsAFMsHEssHWM8BWM8WQBOAQPRDAeIBII6KEEUQNEMA2zztVJJfBuIqABzIyx/LB8sHyz/0APQAybmYlfQ=')

export class MultisigWallet {
    public publicKeys: Buffer[]
    public workchain: number
    public walletId: number
    public k: number
    public address: Address

    constructor (publicKeys: Buffer[], workchain: number, walletId: number, k: number) {
        this.publicKeys = publicKeys
        this.workchain = workchain
        this.walletId = walletId
        this.k = k
        let owners: Dictionary<number, Cell> = Dictionary.empty()
        for (let i = 0; i < publicKeys.length; i += 1) {
            owners.set(i, beginCell().storeBuffer(publicKeys[i]).storeUint(0, 8).endCell())
        }
        const stateInit: StateInit = {
            code: MULTISIG_CODE,
            data: beginCell()
                .storeUint(walletId, 32)
                .storeUint(publicKeys.length, 8)
                .storeUint(k, 8)
                .storeUint(0, 64)
                .storeDict(owners, Dictionary.Keys.Uint(8), Dictionary.Values.Cell())
                .storeBit(0)
            .endCell()
        }
        this.address = contractAddress(workchain, stateInit)
    }
    
    static async fromAddress (client: TonClient, address: Address): Promise<MultisigWallet> {
        const contractState = await client.getContractState(address)
        const data: Slice = Cell.fromBoc(contractState.data!)[0].beginParse()
        const walletId: number = data.loadUint(32)
        data.skip(8)
        const k: number = data.loadUint(8)
        data.skip(64)
        const owners = data.loadDict(Dictionary.Keys.Uint(8), Dictionary.Values.Cell())
        let publicKeys: Buffer[] = []
        for (const [key, value] of owners) {
            const publicKey = value.beginParse().loadBuffer(64)
            publicKeys.push(publicKey)
        }
        return new MultisigWallet(publicKeys, address.workChain, walletId, k)
    }

    public formStateInit (): StateInit {
        let owners: Dictionary<number, Cell> = Dictionary.empty()
        for (let i = 0; i < this.publicKeys.length; i += 1) {
            owners.set(i, beginCell().storeBuffer(this.publicKeys[i]).storeUint(0, 8).endCell())
        }
        const data: Cell = beginCell()
            .storeUint(this.walletId, 32)
            .storeUint(this.publicKeys.length, 8)
            .storeUint(this.k, 8)
            .storeUint(0, 64)
            .storeBit(1)
            .storeDict(owners)
            .storeBit(0)
        .endCell()
        return {
            code: MULTISIG_CODE,
            data
        }
    }

    public sendOrder (client: TonClient, order: Order, secretKey: Buffer) {
        let sugoma = beginCell()
            .storeDict(order.signatures, Dictionary.Keys.Uint(8), Dictionary.Values.Buffer(64))
            .storeBuffer(order.messagesCell.hash())
            .storeSlice(order.messagesCell.asSlice())
        .endCell()
        let publicKey: Buffer = keyPairFromSecretKey(secretKey).publicKey
        let ownerId: number = this.getOwnerIdByPubkey(publicKey)
        let amogus = beginCell()
            .storeUint(ownerId, 8)
            .storeBit(0)
            .storeUint(this.walletId, 32)
            .storeSlice(sugoma.asSlice())
            .endCell()
        let suspect = beginCell()
            .storeBuffer(sign(amogus.hash(), secretKey))
            .storeSlice(amogus.asSlice())
            .endCell()
        
        
        let message: Message = external({ body: suspect, to: this.address })
        client.sendMessage(message)
    }
    
    public getOwnerIdByPubkey (publicKey: Buffer) {
        for (let i = 0; i < this.publicKeys.length; i += 1) {
            if (this.publicKeys[i].equals(publicKey)) {
                return i
            }
        }
        return -1
    }
}