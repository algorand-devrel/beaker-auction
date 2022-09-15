import algosdk from 'algosdk'
import { Auction } from './beaker/auction_client'
import { MyAlgoSession } from './wallets/myalgo'

const myAlgo = new MyAlgoSession()
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

async function signer (txns: algosdk.Transaction[]) {
  const sTxns = await myAlgo.signTxns(txns)
  return sTxns.map(s => s.blob)
}

(async function () {
  await myAlgo.getAccounts()
  const account = myAlgo.accounts[0]

  const appClient = new Auction({
    client: algodClient,
    signer,
    sender: account.address
  })

  const [appId, appAddr, txId] = await appClient.create()
  document.getElementById('status').innerHTML = `App created with id ${appId} and address ${appAddr} in tx ${txId}`
})()
