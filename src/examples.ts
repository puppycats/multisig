import { TonClient, WalletContractV4 } from "ton"
import { mnemonicToPrivateKey } from "ton-crypto"
import { MultisigWallet } from "./MultisigWallet"
import { Order } from "./Order"

async function main() {
    const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC'
    })
  
    let keyPairs = []

    for (let i = 0; i < mnemonics.length; i++) {
        keyPairs[i] = await mnemonicToPrivateKey(mnemonics[i])
    }

    console.log(keyPairs)


    //How to create new multisig object
    let pk1 = [keyPairs[0].publicKey, keyPairs[1].publicKey]

    let mw1 = new MultisigWallet(pk1, 0, 0, 1, { client })

    let wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPairs[0].publicKey });

    //How to deploy multisig wallet via internal message
    await mw1.deployInternal(wallet.sender(client.provider(wallet.address, null), keyPairs[0].secretKey))
    //end

    //How to deploy multisig wallet via external message
    await mw1.deployExternal()
    //end

    //How to get multisig wallet address
    let addr = mw1.address

    //How to get multisig wallet from address
    let mw2 = await MultisigWallet.fromAddress(addr, { client })

    //how to create order
    let order1 = new Order()
    //TODO

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
]]

main()