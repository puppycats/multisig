import { expect } from 'chai'
import { beginCell, Cell, Address, ContractProvider, CommonMessageInfoRelaxed } from 'ton-core'
import { getSecureRandomBytes, keyPairFromSeed } from 'ton-crypto'
import { testAddress } from 'ton-emulator'
import { ContractSystem } from 'ton-emulator/dist/emulator/ContractSystem'
import { Treasure } from 'ton-emulator/dist/treasure/Treasure'
import { MessageWithMode } from '../src/types'
import { Order, MultisigWallet } from './../src/index'

function createCommonMessageInfoInternal (bounce: boolean, dest: Address, value: bigint): CommonMessageInfoRelaxed {
    return {
        bounce,
        bounced: false,
        createdAt: 0,
        createdLt: 0n,
        dest,
        forwardFee: 0n,
        ihrDisabled: true,
        ihrFee: 0n,
        type: 'internal',
        value: {
            coins: value
        }
    }
}

function createInternalMessageWithMode (bounce: boolean, dest: Address, value: bigint, body: Cell, mode: number = 3): MessageWithMode {
    return {
        message: {
            info: createCommonMessageInfoInternal(bounce, dest, value),
            body
        },
        mode: mode
    }
}

describe('Order', () => {
    var publicKeys: Buffer[]
    var secretKeys: Buffer[]

    before(async () => {
        publicKeys = []
        secretKeys = []
        for (let i = 0; i < 10; i += 1) {
            let kp = keyPairFromSeed(await getSecureRandomBytes(32))
            publicKeys.push(kp.publicKey)
            secretKeys.push(kp.secretKey)
        }
    })

    it('should add messages', () => {
        let order = new Order()
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 1000000000n, Cell.EMPTY))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address2'), 0n, beginCell().storeUint(3, 123).endCell()))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 2000000000n, Cell.EMPTY))
        expect(order.messages).to.have.lengthOf(3)
    })

    it('should add signatures', () => {
        let order = new Order()
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 1000000000n, Cell.EMPTY))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address2'), 0n, beginCell().storeUint(3, 123).endCell()))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 2000000000n, Cell.EMPTY))
        order.addSignature(1, secretKeys[0])
        order.addSignature(2, secretKeys[1])
        order.addSignature(3, secretKeys[2])
        expect(order.signatures.size).to.equal(3)
    })

    it('should union signatures', () => {
        let order1 = new Order()
        order1.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 1000000000n, Cell.EMPTY))
        order1.addMessage(createInternalMessageWithMode(true, testAddress('address2'), 0n, beginCell().storeUint(3, 123).endCell()))
        order1.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 2000000000n, Cell.EMPTY))
        order1.addSignature(1, secretKeys[0])
        order1.addSignature(2, secretKeys[1])
        order1.addSignature(3, secretKeys[2])
        let order2 = new Order()
        order2.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 1000000000n, Cell.EMPTY))
        order2.addMessage(createInternalMessageWithMode(true, testAddress('address2'), 0n, beginCell().storeUint(3, 123).endCell()))
        order2.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 2000000000n, Cell.EMPTY))
        order2.addSignature(4, secretKeys[3])
        order2.addSignature(3, secretKeys[2])
        order2.addSignature(6, secretKeys[5])
        order1.unionSignatures(order2)
        expect(order1.signatures.size).to.equal(5)
    })

    it('should clear signatures', () => {
        let order = new Order()
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 1000000000n, Cell.EMPTY))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address2'), 0n, beginCell().storeUint(3, 123).endCell()))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 2000000000n, Cell.EMPTY))
        order.addSignature(1, secretKeys[0])
        order.addSignature(2, secretKeys[1])
        order.addSignature(3, secretKeys[2])
        order.clearSignatures()
        expect(order.signatures.size).to.equal(0)
    })
})

describe('MultisigWallet', () => {
    var publicKeys: Buffer[]
    var secretKeys: Buffer[]
    var system: ContractSystem
    var treasure: Treasure

    function createProvider (multisig: MultisigWallet): ContractProvider {
        const stateInit = multisig.formStateInit()
        return system.provider({
            address: multisig.address,
            init: {
                code: stateInit.code!,
                data: stateInit.data!
            }
        })
    }

    before(async () => {
        publicKeys = []
        secretKeys = []
        for (let i = 0; i < 10; i += 1) {
            let kp = keyPairFromSeed(await getSecureRandomBytes(32))
            publicKeys.push(kp.publicKey)
            secretKeys.push(kp.secretKey)
        }
    })

    beforeEach(async () => {
        system = await ContractSystem.create()
        treasure = await system.treasure('my-treasure')
    })

    it('should create MultisigWallet object', () => {
        let multisig = new MultisigWallet(publicKeys, 0, 123, 2)
    })

    it('should deploy via internal message', async () => {
        let multisig = new MultisigWallet(publicKeys, 0, 123, 2)
        let provider = createProvider(multisig)
        
        await multisig.deployInternal(treasure)
        let txs = await system.run()
        expect(txs).to.have.lengthOf(2)
        expect(txs[1].endStatus).to.equal('active')
    })

    it('should load contract from address', async () => {
        let multisig = new MultisigWallet(publicKeys, 0, 123, 2)
        let provider = createProvider(multisig)
        await multisig.deployInternal(treasure)
        await system.run()

        let multisigFromProvider = await MultisigWallet.fromAddress(multisig.address, provider)
        expect(multisig.address.toRawString()).to.be.equal(multisigFromProvider.address.toRawString())
        expect(multisig.owners.keys().toString()).to.be.equal(multisigFromProvider.owners.keys().toString())
        expect(multisig.owners.values().toString()).to.be.equal(multisigFromProvider.owners.values().toString())
    })

    it('should find order by public key', () => {
        let multisig = new MultisigWallet(publicKeys, 0, 123, 2)
        for (let i = 0; i < publicKeys.length; i += 1) {
            expect(multisig.getOwnerIdByPubkey(publicKeys[i])).to.be.equal(i)
        }
    })

    it('should accept orders', async () => {
        let multisig = new MultisigWallet(publicKeys, 0, 123, 2)
        let provider = createProvider(multisig)
        await multisig.deployInternal(treasure, 10000000000n)
        await system.run()

        let order = new Order()
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 1000000000n, Cell.EMPTY))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address2'), 0n, beginCell().storeUint(3, 123).endCell()))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 2000000000n, Cell.EMPTY))

        await multisig.sendOrder(provider, order, secretKeys[3])
        let txs = await system.run()
    })

    it('should accept multiple orders and send messages', async () => {
        let multisig = new MultisigWallet(publicKeys, 0, 123, 5)
        let provider = createProvider(multisig)
        await multisig.deployInternal(treasure, 10000000000n)
        await system.run()

        let order = new Order()
        order.addMessage(createInternalMessageWithMode(false, testAddress('address1'), 1000000000n, Cell.EMPTY))
        order.addMessage(createInternalMessageWithMode(false, testAddress('address2'), 0n, beginCell().storeUint(3, 123).endCell()))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 2000000000n, Cell.EMPTY))

        for (let i = 0; i < 4; i += 1) {
            await multisig.sendOrder(provider, order, secretKeys[i])
            await system.run()
        }

        await multisig.sendOrder(provider, order, secretKeys[7])
        let txs = await system.run()
        expect(txs).to.have.lengthOf(5)
    })
})