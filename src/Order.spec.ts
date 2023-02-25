/* Made by @Gusarich and @Miandic */

import { beginCell, Cell, MessageRelaxed, Address } from 'ton-core';
import { getSecureRandomBytes, keyPairFromSeed, sign } from 'ton-crypto';
import { testAddress } from 'ton-emulator';
import { OrderBuilder } from './OrderBuilder';
import { MultisigWallet } from './MultisigWallet';
import { Order } from './Order';

function createInternalMessage(
    bounce: boolean,
    dest: Address,
    value: bigint,
    body: Cell,
    mode: number = 3
): MessageRelaxed {
    return {
        info: {
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
                coins: value,
            },
        },
        body,
    };
}

describe('Order', () => {
    var publicKeys: Buffer[];
    var secretKeys: Buffer[];

    beforeAll(async () => {
        publicKeys = [];
        secretKeys = [];
        for (let i = 0; i < 10; i += 1) {
            let kp = keyPairFromSeed(await getSecureRandomBytes(32));
            publicKeys.push(kp.publicKey);
            secretKeys.push(kp.secretKey);
        }
    });

    it('should add messages', () => {
        let order = new OrderBuilder(123);
        order.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                1000000000n,
                Cell.EMPTY
            ),
            3
        );
        order.addMessage(
            createInternalMessage(
                true,
                testAddress('address2'),
                0n,
                beginCell().storeUint(3, 123).endCell()
            ),
            3
        );
        order.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                2000000000n,
                Cell.EMPTY
            ),
            3
        );
        expect(order.messages.endCell().refs.length).toEqual(3);
    });

    it('should add signatures', () => {
        let orderBuilder = new OrderBuilder(123);
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                1000000000n,
                Cell.EMPTY
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address2'),
                0n,
                beginCell().storeUint(3, 123).endCell()
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                2000000000n,
                Cell.EMPTY
            ),
            3
        );
        let order = orderBuilder.finishOrder();
        order.sign(0, secretKeys[0]);
        order.sign(1, secretKeys[1]);
        order.sign(2, secretKeys[2]);
        expect(Object.keys(order.signatures)).toHaveLength(3);
    });

    it('should union signatures', () => {
        let order1Builder = new OrderBuilder(123);
        order1Builder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                1000000000n,
                Cell.EMPTY
            ),
            3
        );
        order1Builder.addMessage(
            createInternalMessage(
                true,
                testAddress('address2'),
                0n,
                beginCell().storeUint(3, 123).endCell()
            ),
            3
        );
        order1Builder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                2000000000n,
                Cell.EMPTY
            ),
            3
        );
        let order1 = order1Builder.finishOrder();
        order1.sign(0, secretKeys[0]);
        order1.sign(1, secretKeys[1]);
        order1.sign(2, secretKeys[2]);
        let order2Builder = new OrderBuilder(123);
        order2Builder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                1000000000n,
                Cell.EMPTY
            ),
            3
        );
        order2Builder.addMessage(
            createInternalMessage(
                true,
                testAddress('address2'),
                0n,
                beginCell().storeUint(3, 123).endCell()
            ),
            3
        );
        order2Builder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                2000000000n,
                Cell.EMPTY
            ),
            3
        );
        let order2 = order2Builder.finishOrder();
        order2.sign(3, secretKeys[3]);
        order2.sign(2, secretKeys[2]);
        order2.sign(5, secretKeys[5]);
        order1.unionSignatures(order2);
        expect(Object.keys(order1.signatures)).toHaveLength(5);
    });

    it('should clear signatures', () => {
        let orderBuilder = new OrderBuilder(123);
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                1000000000n,
                Cell.EMPTY
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address2'),
                0n,
                beginCell().storeUint(3, 123).endCell()
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                2000000000n,
                Cell.EMPTY
            ),
            3
        );
        let order = orderBuilder.finishOrder();
        order.sign(0, secretKeys[0]);
        order.sign(1, secretKeys[1]);
        order.sign(2, secretKeys[2]);
        order.clearSignatures();
        expect(order.signatures).toBeNull;
    });

    it('should clear messages', () => {
        let orderBuilder = new OrderBuilder(123);
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                1000000000n,
                Cell.EMPTY
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address2'),
                0n,
                beginCell().storeUint(3, 123).endCell()
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                2000000000n,
                Cell.EMPTY
            ),
            3
        );
        orderBuilder.clearMessages();
        expect(orderBuilder.messages).toEqual(beginCell());
    });

    it('should add signatures without secret key', () => {
        let orderBuilder = new OrderBuilder(123);
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                1000000000n,
                Cell.EMPTY
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address2'),
                0n,
                beginCell().storeUint(3, 123).endCell()
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                2000000000n,
                Cell.EMPTY
            ),
            3
        );
        let order = orderBuilder.finishOrder();
        order.sign(0, secretKeys[0]);
        order.addSignature(
            1,
            sign(order.messagesCell.hash(), secretKeys[1]),
            new MultisigWallet(publicKeys, 0, 123, 2)
        );
        expect(Object.keys(order.signatures)).toHaveLength(2);
    });

    it('should throw on more than 4 messages', () => {
        let orderBuilder = new OrderBuilder(123);
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                1000000000n,
                Cell.EMPTY
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address2'),
                0n,
                beginCell().storeUint(3, 123).endCell()
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                2000000000n,
                Cell.EMPTY
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                2000000000n,
                Cell.EMPTY
            ),
            3
        );
        expect(() =>
            orderBuilder.addMessage(
                createInternalMessage(
                    true,
                    testAddress('address1'),
                    2000000000n,
                    Cell.EMPTY
                ),
                3
            )
        ).toThrow();
    });

    it('should throw on invalid signature', () => {
        let orderBuilder = new OrderBuilder(123);
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                1000000000n,
                Cell.EMPTY
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address2'),
                0n,
                beginCell().storeUint(3, 123).endCell()
            ),
            3
        );
        orderBuilder.addMessage(
            createInternalMessage(
                true,
                testAddress('address1'),
                2000000000n,
                Cell.EMPTY
            ),
            3
        );
        let order = orderBuilder.finishOrder();
        order.sign(0, secretKeys[0]);
        expect(() =>
            order.addSignature(
                1,
                Buffer.alloc(64),
                new MultisigWallet(publicKeys, 0, 123, 2)
            )
        ).toThrow();
    });

    it('should export to cell', () => {});

    it('should load from cell', () => {
        const order1Cell = Cell.fromBoc(
            Buffer.from(
                'B5EE9C7241010201004700011B0000000031FD2F910000000001C0010068620014811EF5893924A58891883AA5563EE83305B47E62061D349E4BDECD66D2F2B1A02FAF08000000000000000000000000000021E26136',
                'hex'
            )
        )[0];
        const order2Cell = Cell.fromBoc(
            Buffer.from(
                'B5EE9C7241010301008C00021B8000000031FD2F910000000001C001020083E67410438C1007888D2CD45436502FBA877BECE26E7F384709B29B4A607181B8473CC4D45B44F7C47590740936231AE001727CCCA955DCDF959955D3889F4E0F00400068620014811EF5893924A58891883AA5563EE83305B47E62061D349E4BDECD66D2F2B1A02FAF080000000000000000000000000000621311E8',
                'hex'
            )
        )[0];
        const order3Cell = Cell.fromBoc(
            Buffer.from(
                'B5EE9C724101040100D100021B8000000031FD2F910000000001C0010201836100CBF8BBD98C5FE999FB232678DF1CC06A3522DB55736B3FF846C65AD1619694B8BDEF50B8DCF390AD54A4076B7444600FE54CC2EBFA68ED07F3063437DF0501C0030068620014811EF5893924A58891883AA5563EE83305B47E62061D349E4BDECD66D2F2B1A02FAF0800000000000000000000000000000083E67410438C1007888D2CD45436502FBA877BECE26E7F384709B29B4A607181B8473CC4D45B44F7C47590740936231AE001727CCCA955DCDF959955D3889F4E0F0040A434CD60',
                'hex'
            )
        )[0];

        const order1 = Order.fromCell(order1Cell);
        const order2 = Order.fromCell(order2Cell);
        const order3 = Order.fromCell(order3Cell);

        expect(order1.messagesCell.refs).toHaveLength(1);
        expect(Object.keys(order1.signatures)).toHaveLength(0);
        expect(Object.keys(order2.signatures)).toHaveLength(1);
        expect(Object.keys(order3.signatures)).toHaveLength(2);
    });
});
