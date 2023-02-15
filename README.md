# Multisig
TS Library for interactions with TON Multi-signature wallets

## Usage
There are two main classes in this library: `MultisigWallet` and `Order`.

### MultisigWallet
#### Constructor
>
`new MultisigWallet(publicKeys: Buffer[], workchain: number, walletId: number, k: number, opts?: {
        address?: Address,
        provider?: ContractProvider,
        client?: TonClient
    })`
- `publicKeys` - array of public keys of the wallet owners
- `workchain` - workchain to deploy the wallet to
- `walletId` - wallet id
- `k` - number of signatures required to confirm a transaction
- `address` - force to use this address as the wallet address
- `provider` - `ContractProvider` instance
- `client` - `TonClient` instance

#### Properties
- `owners` - `Dictionary<number, Buffer>` of signatures *ownerId => signature*
- `workchain` - workchain where the wallet is deployed
- `walletId` - wallet id
- `k` - number of signatures required to confirm a transaction
- `address` - wallet address
- `provider` - `ContractProvider` instance

#### Methods
##### fromAddress

`fromAddress (address: Address, opts: {
        provider?: ContractProvider,
        client?: TonClient
    }): Promise<MultisigWallet>`

- `address` - address of the already deployed wallet
- `provider` - `ContractProvider` instance
- `client` - `TonClient` instance

Static method to create a wallet instance from an already deployed wallet address

##### deployExternal

`deployExternal (provider?: ContractProvider): Promise<void>`

 - `provider` - `ContractProvider` instance
 
Deploy this `MutlisigWallet` via external message

##### deployInternal

`deployInternal (sender: Sender, value: bigint): Promise<void>`

 - `sender` - `Sender` instance
 - `value` - value in nanoTons for deploy message
 
Deploy this `MultisigWallet` via internal message

##### sendOrder

`sendOrder (order: Order, secretKey: Buffer, provider?: ContractProvider): Promise<void>`

- `order` - order to send signed by owners
- `secretKey` - secret key of the sender (to rootsign the order)
- `provider` - `ContractProvider` instance

Rootsign and send signed order to the wallet

##### getOwnerIdByPubkey

`getOwnerIdByPubkey (publicKey: Buffer): number`

- `publicKey` - public key of the owner

Returns owner id by public key

##### formStateInit

`formStateInit (): StateInit`

Forms state init for this wallet

### Order
#### Constructor
`new Order(walletId: number, offset?: number)`
- `walletId` - wallet id
- `offset` - the time in seconds after which the order will expire (automatically updates after each `addMessage` call)

#### Properties
- `messages` - array of `MessageWithMode` to be added to the order
- `signatures` - `Dictionary<number, Buffer>` of signatures *ownerId => signature*
- `querryId` - golbal time until which the order is valid

#### Methods
##### addMessage
`addMessage (message: MessageRelaxed, mode: number): void`

- `message` - message to add to the order
- `mode` - mode of the message

Clears all previous signatures, renewing *querryId* with new time and adds a new message to the order

##### addSignature
`addSignature (ownerId: number, secretKey: Buffer): void`

- `ownerId` - id of the owner
- `secretKey` - secret key of the owner

Signs the order with the owner's secret key and adds the signature to the order

##### unionSignatures
`unionSignatures (other: Order): void`

- `other` - order to add signatures from

Adds signatures from another order to this one

##### clearMessages
`clearMessages (): void`

Clears all messages

##### clearSignatures
`clearSignatures (): void`

Clears all signatures
