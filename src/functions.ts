import { Buffer } from 'buffer'
import { Address, beginCell, Cell, Dictionary, Message, StateInit, contractAddress, toNano } from 'ton-core'
import { Order, MessageWithMode } from './types'

const MULTISIG_CODE = Cell.fromBase64('te6cckECKwEABBgAART/APSkE/S88sgLAQIBIAIDAgFIBAUE2vIgxwCOgzDbPOCDCNcYIPkBAdMH2zwiwAAToVNxePQOb6Hyn9s8VBq6+RDyoAb0BCD5AQHTH1EYuvKq0z9wUwHwCgHCCAGDCryx8mhTFYBA9A5voSCYDqQgwgryZw7f+COqH1NAufJhVCOjU04gIyEiAgLMBgcCASAMDQIBIAgJAgFmCgsAA9GEAiPymAvHoHN9CYbZ5S7Z4BPHohwhJQAtAKkItdJEqCTItdKlwLUAdAT8ArobBKAATwhbpEx4CBukTDgAdAg10rDAJrUAvALyFjPFszJ4HHXI8gBzxb0AMmACASAODwIBIBQVARW77ZbVA0cFUg2zyCoCAUgQEQIBIBITAXOxHXQgwjXGCD5AQHTB4IB1MTtQ9hTIHj0Dm+h8p/XC/9eMfkQ8qCuAfQEIW6TW3Ey4PkBWNs8AaQBgJwA9rtqA6ADoAPoCAXoCEfyAgPyA3XlP+AXkegAA54tkwAAXrhlXP8EA1WZ2oexAAgEgFhcCASAYGQFRtyVbZ4YmRmpGEAgegc30McJNhFpAADMaYeYuAFrgJhwLb+4cC3d0bhAjAYm1WZtnhqvgb+2xxsoicAgej430pBHEoFpAADHDhBACGuQkuuBk9kUWE5kAOeLKhACQCB6IYFImHFImHFImXEA2YlzNijAjAgEgGhsAF7UGtc4QQDVZnah7EAIBIBwdAgOZOB4fARGsGm2eL4G2CUAjABWt+UEAzJV2oewYQAENqTbPBVfBYCMAFa3f3CCAarM7UPYgAiDbPALyZfgAUENxQxPbPO1UIyoACtP/0wcwBKDbPC+uUyCw8mISsQKkJbNTHLmwJYEA4aojoCi8sPJpggGGoPgBBZcCERACPj4wjo0REB/bPEDXePRDEL0F4lQWW1Rz51YQU9zbPFRxClR6vCQlKCYAIO1E0NMf0wfTB9M/9AT0BNEAXgGOGjDSAAHyo9MH0wdQA9cBIPkBBfkBFbrypFAD4GwhIddKqgIi10m68qtwVCATAAwByMv/ywcE1ts87VT4D3AlblOJvrGYEG4QLVDHXwePGzBUJANQTds8UFWgRlAQSRA6SwlTuds8UFQWf+L4AAeDJaGOLCaAQPSWb6UglDBTA7neII4WODk5CNIAAZfTBzAW8AcFkTDifwgHBZJsMeKz5jAGKicoKQBgcI4pA9CDCNcY0wf0BDBTFnj0Dm+h8qXXC/9URUT5EPKmrlIgsVIDvRShI27mbCIyAH5SML6OIF8D+ACTItdKmALTB9QC+wAC6DJwyMoAQBSAQPRDAvAHjhdxyMsAFMsHEssHWM8BWM8WQBOAQPRDAeIBII6KEEUQNEMA2zztVJJfBuIqABzIyx/LB8sHyz/0APQAybmYlfQ=')

export function newMultisig (pubkeys: Buffer[], workchain: number, walletId: number, k: number): Message {
    let owners: Dictionary<number, Cell> = Dictionary.empty()
    for (let i = 0; i < pubkeys.length; i += 1) {
        owners.set(i, beginCell().storeBuffer(pubkeys[i]).storeUint(0, 8).endCell())
    }
    const stateInit: StateInit = {
        code: MULTISIG_CODE,
        data: beginCell()
            .storeUint(walletId, 32)
            .storeUint(pubkeys.length, 8)
            .storeUint(k, 8)
            .storeUint(0, 64)
            .storeDict(owners, Dictionary.Keys.Uint(8), Dictionary.Values.Cell())
            .storeBit(0)
        .endCell()
    }
    const address: Address = contractAddress(0, stateInit)

    return {
        body: beginCell().endCell(),
        info: {
            bounce: false,
            bounced: false,
            createdAt: 0,
            createdLt: 0n,
            dest: address,
            forwardFee: 0n,
            ihrDisabled: true,
            ihrFee: 0n,
            src: address,
            type: "internal",
            value: {
                coins: toNano('0.1'),
            }
        },
        init: stateInit
    }
}

export function createOrder (messages: MessageWithMode[], signatures?: Dictionary<number, Buffer>): Order {
    return {
        messages,
        signatures: signatures ? signatures : Dictionary.empty()
    }
}

export function addSignature (order: Order, ownerId: number, signature: Buffer): Order {
    order.signatures.set(ownerId, signature)
    return order
}