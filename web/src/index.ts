import { PeraSession } from './wallets/pera'
import * as algokit from '@algorandfoundation/algokit-utils'
import { ApplicationClient } from '@algorandfoundation/algokit-utils/types/app-client'
import appspec from '../application.json'
import algosdk from 'algosdk'
const pera = new PeraSession()
const algodClient = algokit.getAlgoClient(algokit.getAlgoNodeConfig('testnet', 'algod'))
const indexerClient = algokit.getAlgoIndexerClient(algokit.getAlgoNodeConfig('testnet', 'indexer'))

let auctionAppId: number
let auctionApp: ApplicationClient

const accountsMenu = document.getElementById('accounts') as HTMLSelectElement
const amountInput = document.getElementById('amount') as HTMLInputElement
const asaInput = document.getElementById('asa') as HTMLInputElement
const asaAmountInput = document.getElementById('asa-amount') as HTMLInputElement
const buttonIds = ['create', 'connect', 'start', 'bid', 'claim-bid', 'claim-asset']
const buttons: { [key: string]: HTMLButtonElement } = {}
buttonIds.forEach(id => {
  buttons[id] = document.getElementById(id) as HTMLButtonElement
})

async function signer (txns: algosdk.Transaction[]) {
  return await pera.signTxns(txns)
}

buttons.connect.onclick = async () => {
  await pera.getAccounts()
  buttons.create.disabled = false
  pera.accounts.forEach(account => {
    accountsMenu.add(new Option(account, account))
  })
}

buttons.create.onclick = async () => {
  document.getElementById('status').innerHTML = 'Creating auction app...'
  const sender = {
    addr: accountsMenu.selectedOptions[0].value,
    signer
  }

  auctionApp = algokit.getAppClient(
    {
      app: JSON.stringify(appspec),
      sender,
      creatorAddress: sender.addr,
      indexer: indexerClient
    },
    algodClient
  )

  const { appId, appAddress, transaction } = await auctionApp.create()

  auctionAppId = appId

  document.getElementById('status').innerHTML = `App created with id ${appId} and address ${appAddress} in tx ${transaction.txID()}. See it <a href='https://testnet.algoscan.app/app/${appId}'>here</a>`

  buttons.start.disabled = false
  buttons.create.disabled = true
}

buttons.start.onclick = async () => {
  document.getElementById('status').innerHTML = 'Starting auction...'
  const sender = accountsMenu.selectedOptions[0].value

  const atc = new algosdk.AtomicTransactionComposer()
  const asa = asaInput.valueAsNumber
  const suggestedParams = await algodClient.getTransactionParams().do()

  // Fund app
  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    amount: 200_000,
    from: sender,
    to: algosdk.getApplicationAddress(auctionAppId)
  })
  atc.addTransaction({ txn: payment, signer })

  // Opt app into ASA
  atc.addMethodCall(
    {
      appID: auctionAppId,
      method: auctionApp.getABIMethod('opt_into_asset'),
      sender,
      signer,
      suggestedParams: { ...suggestedParams, fee: 2_000, flatFee: true },
      methodArgs: [asa]
    })

  const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: sender,
    amount: asaAmountInput.valueAsNumber,
    to: algosdk.getApplicationAddress(auctionAppId),
    assetIndex: asa
  })

  // Start auction
  atc.addMethodCall(
    {
      appID: auctionAppId,
      method: auctionApp.getABIMethod('start_auction'),
      sender,
      signer,
      suggestedParams: await algodClient.getTransactionParams().do(),
      methodArgs: [amountInput.valueAsNumber, 36_000, { txn: axfer, signer }]
    })

  await algokit.sendAtomicTransactionComposer({ atc }, algodClient)

  document.getElementById('status').innerHTML = `Auction started! See the app <a href='https://testnet.algoscan.app/app/${auctionAppId}'>here</a>`

  buttons.bid.disabled = false
  buttons.start.disabled = true
}

buttons.bid.onclick = async () => {
  document.getElementById('status').innerHTML = 'Sending bid...'
  const sender = {
    addr: accountsMenu.selectedOptions[0].value,
    signer
  }

  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams: await algodClient.getTransactionParams().do(),
    amount: amountInput.valueAsNumber,
    from: sender.addr,
    to: algosdk.getApplicationAddress(auctionAppId)
  })

  // @ts-ignore
  const highestBidder = (await auctionApp.getGlobalState()).highest_bidder.valueRaw as Uint8Array

  const prevBidder = highestBidder.byteLength ? algosdk.encodeAddress(highestBidder) : sender.addr

  await auctionApp.call({
    method: 'bid',
    methodArgs: [{ txn: payment, signer }, prevBidder],
    sender,
    sendParams: { fee: algokit.microAlgos(2_000) }
  })

  document.getElementById('status').innerHTML = `Bid sent! See the app <a href='https://testnet.algoscan.app/app/${auctionAppId}'>here</a>`

  buttons['claim-bid'].disabled = false
  buttons['claim-asset'].disabled = false
}

buttons['claim-bid'].onclick = async () => {
  await auctionApp.call({
    method: 'claim_bid',
    methodArgs: [],
    sender: { addr: accountsMenu.selectedOptions[0].value, signer },
    sendParams: { fee: algokit.microAlgos(2_000) }
  })

  buttons.bid.disabled = true
  document.getElementById('status').innerHTML = `Bid claimed! See the app <a href='https://testnet.algoscan.app/app/${auctionAppId}'>here</a>`
}

buttons['claim-asset'].onclick = async () => {
  const asa = asaInput.valueAsNumber
  const asaCreator = (await algodClient.getAssetByID(asa).do()).params.creator

  await auctionApp.call({
    method: 'claim_asset',
    methodArgs: [asa, asaCreator],
    sender: { addr: accountsMenu.selectedOptions[0].value, signer },
    sendParams: { fee: algokit.microAlgos(2_000) }
  })

  buttons.bid.disabled = true
  document.getElementById('status').innerHTML = `Asset claimed! See the app <a href='https://testnet.algoscan.app/app/${auctionAppId}'>here</a>`
}
