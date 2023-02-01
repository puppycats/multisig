import { Dictionary } from 'ton-core/dist/dict/Dictionary';
import { MessageWithMode } from './types';

export class Order {
    public messages: MessageWithMode[];
    public signatures: Dictionary<number, Buffer>;

    constructor (messages?: MessageWithMode[], signatures?: Dictionary<number, Buffer>) {
        this.messages = messages || [];
        this.signatures = signatures || Dictionary.empty();
    }

    public addMessage (message: MessageWithMode) {
        this.messages.push(message);
    }

    public addSignature (ownerId: number, signature: Buffer) {
        this.signatures.set(ownerId, signature);
    }

    public unionSignatures (other: Order) {
        for (const [key, value] of other.signatures) {
            this.signatures.set(key, value);
        }
    }

    public clearSignatures () {
        this.signatures = Dictionary.empty();
    }
}

