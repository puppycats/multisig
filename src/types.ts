import { Message } from "ton-core";

export type MessageWithMode = {
    message: Message;
    mode: number;
};