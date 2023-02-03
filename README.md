# Multisig
TS Library for interactions with TON Multi-signature wallets

## Usage
There are two main classes in this library: `MultisigWallet` and `Order`.

### MultisigWallet
#### Constructor
>`new MultisigWallet(publicKeys: Buffer[], workchain: number, walletId: number, k: number)`
- `publicKeys` - array of public keys of the wallet owners
- `workchain` - workchain to deploy the wallet to
- `walletId` - wallet id
- `k` - number of signatures required to confirm a transaction

#### Properties
- `owners` - `Dictionary<number, Buffer>` of signatures *ownerId => signature*
- `workchain` - workchain where the wallet is deployed
- `walletId` - wallet id
- `k` - number of signatures required to confirm a transaction
- `address` - wallet address

#### Methods
>deployExternal
`deployExternal (provider: ContractProvider): void`
 - `provider` - `ContractProvider` instance
Deploy this `MutlisigWallet` via external message

>deployInternal
`deployInternal (sender: Sender, value: bigint): void`
 - `sender` - `Sender` instance
 - `value` - value in nanoTons for deploy message
Deploy this `MultisigWallet` via internal message

>formStateInit
`formStateInit (): StateInit`
Form `StateInit` for this `MultisigWallet`

>sendOrder
`sendOrder (order: Order, secretKey: Buffer): void`
- `order` - order to send signed by owners
- `secretKey` - secret key of the sender (to rootsign the order)
Rootsign and send signed order to the wallet

>fromAddress
`fromAddress (address: Address, client: TonClient): MultisigWallet`
- `address` - address of the already deployed wallet
- `client` - `TonClient` instance
Static method to create a wallet instance from an already deployed wallet address

>getOwnerIdByPubkey
`getOwnerIdByPubkey (publicKey: Buffer): number`
- `publicKey` - public key of the owner
Returns owner id by public key


### Order
#### Constructor
>`new Order(offset?: number)`
- `offset` - the time in seconds after which the order will expire (automatically updates after each `addMessage` call)

#### Properties
- `messages` - array of `MessageWithMode` to be added to the order
- `signatures` - `Dictionary<number, Buffer>` of signatures *ownerId => signature*
- `messagesCell` - serialized `Cell` with the messages

#### Methods
>addMessage
`addMessage (message: MessageWithMode): void`
- `message` - `MessageWithMode` to be sent
Clears all previous signatures, renewing *querryId* with new time and adds a new message to the order

>addSignature
`addSignature (ownerId: number, secretKey: Buffer): void`
- `ownerId` - id of the owner
- `secretKey` - secret key of the owner
Signs the order with the owner's secret key and adds the signature to the order

>unionSignatures
`unionSignatures (other: Order): void`
- `other` - order to add signatures from
Adds signatures from another order to this one

>clearSignatures
`clearSignatures (): void`

Clears all signatures
