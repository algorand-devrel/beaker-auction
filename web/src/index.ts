import algosdk from 'algosdk'
// import { MyAlgoSession } from './wallets/myalgo'
// import { WalletConnectSession } from './wallets/walletconnect'
// import { AlgoSignerSession } from './wallets/algosigner'
// import Utils from './utils'

try {
    // @ts-ignore
    const account = algosdk.generateAccount()
    console.log(`Generated Algorand account: ${account.addr}`)
    document.getElementById('status').innerHTML = 'SDK Status: Working!'
} catch(e) {
    console.error(e)
    document.getElementById('status').innerHTML = `SDK Status: Error - ${e.message}`
}
