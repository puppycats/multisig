/* Made by @Gusarich and @Miandic */

import {
    beginCell,
    Builder,
    MessageRelaxed,
    storeMessageRelaxed,
} from 'ton-core';
import { Order } from './Order';

export class OrderBuilder {
    public messages: Builder = beginCell();
    public queryId: bigint = 0n;
    private walletId: number;
    private queryOffset: number;

    constructor(walletId: number, offset?: number) {
        this.walletId = walletId;
        this.queryOffset = offset || 7200;
    }

    public addMessage(message: MessageRelaxed, mode: number) {
        if (this.messages.refs >= 4) {
            throw 'only 4 refs are allowed';
        }
        this.updateQueryId();
        this.messages.storeUint(mode, 8);
        this.messages.storeRef(
            beginCell().store(storeMessageRelaxed(message)).endCell()
        );
    }

    public clearMessages() {
        this.messages = beginCell();
    }

    public finishOrder() {
        return new Order(
            beginCell()
                .storeUint(this.walletId, 32)
                .storeUint(this.queryId, 64)
                .storeBuilder(this.messages)
                .endCell()
        );
    }

    private updateQueryId() {
        const time = BigInt(Math.floor(Date.now() / 1000 + this.queryOffset));
        this.queryId = time << 32n;
    }
}
