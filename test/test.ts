import { expect } from 'chai'
import { beginCell, Cell, Address, CommonMessageInfoInternal, Contract, ContractProvider } from 'ton-core'
import { getSecureRandomBytes, keyPairFromSeed } from 'ton-crypto'
import { testAddress } from 'ton-emulator'
import { ContractSystem } from 'ton-emulator/dist/emulator/ContractSystem'
import { Treasure } from 'ton-emulator/dist/treasure/Treasure'
import { MessageWithMode } from '../src/types'
import { Order, MultisigWallet } from './../src/index'

function createCommonMessageInfoInternal (bounce: boolean, dest: Address, value: bigint): CommonMessageInfoInternal {
    return {
        bounce,
        bounced: false,
        createdAt: 0,
        createdLt: 0n,
        dest,
        forwardFee: 0n,
        ihrDisabled: true,
        ihrFee: 0n,
        src: Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'),
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
    it('should add messages', () => {
        let order = new Order()
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 1000000000n, Cell.EMPTY))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address2'), 0n, beginCell().storeUint(3, 123).endCell()))
        order.addMessage(createInternalMessageWithMode(true, testAddress('address1'), 2000000000n, Cell.EMPTY))
        expect(order.messages).to.have.lengthOf(3)
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
})