import { WalletContractV1R1, WalletContractV1R2, WalletContractV1R3, WalletContractV2R1, WalletContractV2R2, WalletContractV3R1, WalletContractV3R2, WalletContractV4 } from "ton"
import { Message } from "ton-core"

export type MessageWithMode = {
    message: Message
    mode: number
}

export type WalletContract = WalletContractV1R1 | WalletContractV1R2 | WalletContractV1R3 | WalletContractV2R1 | WalletContractV2R2 | WalletContractV3R1 | WalletContractV3R2 | WalletContractV4