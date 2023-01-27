import { Buffer } from 'buffer'
import { Dictionary, Message } from 'ton-core'

export type MessageWithMode = {
    message: Message
    mode: number
}

export type Order = {
    messages: MessageWithMode[]
    signatures: Dictionary<number, Buffer>
}