import { Address, beginCell, Cell, fromNano, MessageRelaxed, Sender, toNano, TonClient, WalletContractV4 } from "ton"
import { getHttpEndpoint } from "@orbs-network/ton-access"
import { KeyPair, mnemonicNew, mnemonicToPrivateKey, mnemonicToWalletKey } from "ton-crypto"
import { MultisigWallet } from "./MultisigWallet"
import { Order } from "./Order"
import { Console } from "console"

async function main(mnemonics: string[][]) {
    const endpoint = await getHttpEndpoint()
    const client = new TonClient({ endpoint })
  
    let keyPairs: KeyPair[] = []

    for (let i = 0; i < mnemonics.length; i++) keyPairs[i] = await mnemonicToPrivateKey(mnemonics[i])

    //How to create new multisig object
    let pk1: Buffer[] = [keyPairs[0].publicKey, keyPairs[1].publicKey]

    let mw1: MultisigWallet = new MultisigWallet(pk1, 0, 0, 1, { client })

    let wallet: WalletContractV4 = WalletContractV4.create({ workchain: 0, publicKey: keyPairs[0].publicKey })
    let walletReal: WalletContractV4 = WalletContractV4.create({ workchain: 0, publicKey: keyPairs[4].publicKey })

    let sender: Sender = walletReal.sender(client.provider(walletReal.address, null), keyPairs[4].secretKey)
    
    /*
    await sender.send({
        sendMode: 3,
        to: Address.parse('EQCVhnX-s7B25k-Q0tl9CLhyGiOQ4KckYl0LwzNWa5vnHXb8'),
        value: toNano('0.01'),
        body: Cell.EMPTY,
        bounce: true
    })
    */

    //How to deploy multisig wallet via internal message
    await mw1.deployInternal(walletReal.sender(client.provider(walletReal.address, null), keyPairs[4].secretKey), toNano('0.05'))
    console.log(mw1.address)
    return

    //How to deploy multisig wallet via external message
    //await mw1.deployExternal()


    //How to get multisig wallet address
    let addr: Address = mw1.address


    //How to get multisig wallet from address
    let mw2: MultisigWallet = await MultisigWallet.fromAddress(addr, { client })


    //how to create order
    let order1: Order = new Order(0)


    //How to add message to order
    let msg: MessageRelaxed = {
        body: beginCell().storeBuffer(Buffer.from('Hello, world!')).endCell(),
        info: {
            bounce: true,
            bounced: false,
            createdAt: 0,
            createdLt: 0n,
            dest: Address.parse('EQArzP5prfRJtDM5WrMNWyr9yUTAi0c9o6PfR4hkWy9UQXHx'),
            forwardFee: 0n,
            ihrDisabled: true,
            ihrFee: 0n,
            type: "internal",
            value: {coins: BigInt(10 * 10^9)} //1 TON == 1e9 nanoTON
        }
    }

    order1.addMessage(msg, 0)


    //How to add signature to order
    order1.addSignature(0, keyPairs[0].secretKey)


    //How to union signatures 
    //First create another order
    let order2: Order = new Order(0)
    //Add any message to order
    order2.addMessage(msg, 0)
    //Add signature to order
    order2.addSignature(1, keyPairs[1].secretKey)
    //Union signatures
    order1.unionSignatures(order2)


    //How to clear signatures in order
    order2.clearSignatures()


    //How to clear message in order
    order2.clearMessage()
    

    //How to send order
    await mw2.sendOrder(order1, keyPairs[0].secretKey)
}

let mnemonics = [[
    'orbit',   'feature', 'kangaroo',
    'bargain', 'found',   'task',
    'siren',   'differ',  'submit',
    'inside',  'stamp',   'rather',
    'jar',     'minimum', 'car',
    'minimum', 'deputy',  'genre',
    'toe',     'lumber',  'purchase',
    'hard',    'change',  'supreme'
],
[
    'sing',     'pattern',  'pepper',
    'lava',     'tobacco',  'tip',
    'wheat',    'combine',  'awesome',
    'possible', 'oven',     'find',
    'spot',     'spoil',    'labor',
    'bean',     'never',    'episode',
    'gossip',   'hover',    'jazz',
    'turkey',   'february', 'violin'
],
[
    'piece',   'deputy', 'over',
    'trouble', 'need',   'crime',
    'grow',    'skirt',  'great',
    'motion',  'text',   'congress',
    'trap',    'high',   'screen',
    'mass',    'ramp',   'derive',
    'palm',    'cry',    'click',
    'waste',   'dinner', 'total'
],
[
    'toss',  'shadow',  'over',
    'virus', 'vocal',   'choice',
    'work',  'near',    'about',
    'point', 'door',    'various',
    'owner', 'dove',    'fluid',
    'sight', 'limb',    'wrap',
    'pair',  'mule',    'wet',
    'jeans', 'mention', 'seek'
],
[
    'guard',   'nurse',   'hip',
    'heart',   'domain',  'sauce',
    'stable',  'ritual',  'swear',
    'exist',   'predict', 'enough',
    'stool',   'sunny',   'exist',
    'tilt',    'tiger',   'basic',
    'head',    'pottery', 'swim',
    'romance', 'box',     'enrich'
  ]]

main(mnemonics)