import { expect } from 'chai'
import { beginCell, Cell, CurrencyCollection, Address, CommonMessageInfoInternal } from 'ton-core'
import { getSecureRandomBytes, KeyPair, keyPairFromSeed } from 'ton-crypto'
import { testAddress } from 'ton-emulator'
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

describe('MultisigWallet', async () => {
    var publicKeys: Buffer[] = [],
        secretKeys: Buffer[] = []
    for (let i = 0; i < 10; i += 1) {
        let kp = keyPairFromSeed(await getSecureRandomBytes(32))
        publicKeys.push(kp.publicKey)
        secretKeys.push(kp.secretKey)
    }

    it('should create MultisigWallet object', () => {
        let multisig = new MultisigWallet(publicKeys, 0, 123, 2)
    })
})