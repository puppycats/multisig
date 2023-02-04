import { MessageRelaxed } from "ton-core"

export type MessageWithMode = {
    message: MessageRelaxed
    mode: number
}