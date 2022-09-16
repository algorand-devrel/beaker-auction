import algosdk from 'algosdk'
import * as bkr from 'beaker-ts'
export class Auction extends bkr.ApplicationClient {
  desc: string = ''
  override appSchema: bkr.Schema = { declared: { highest_bid: { type: bkr.AVMType.uint64, key: 'highest_bid', desc: '', static: false }, owner: { type: bkr.AVMType.bytes, key: 'owner', desc: '', static: false }, highest_bidder: { type: bkr.AVMType.bytes, key: 'highest_bidder', desc: '', static: false }, auction_end: { type: bkr.AVMType.uint64, key: 'auction_end', desc: '', static: false } }, dynamic: {} }
  override acctSchema: bkr.Schema = { declared: {}, dynamic: {} }
  override approvalProgram: string = 'I3ByYWdtYSB2ZXJzaW9uIDcKaW50Y2Jsb2NrIDAgMQpieXRlY2Jsb2NrIDB4Njg2OTY3Njg2NTczNzQ1ZjYyNjk2NDY0NjU3MiAweDY4Njk2NzY4NjU3Mzc0NWY2MjY5NjQgMHg2MTc1NjM3NDY5NmY2ZTVmNjU2ZTY0IDB4NmY3NzZlNjU3MiAweAp0eG4gTnVtQXBwQXJncwppbnRjXzAgLy8gMAo9PQpibnogbWFpbl9sOAp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweDc2MzQwMmRmIC8vICJzdGFydF9hdWN0aW9uKHBheSx1aW50NjQsdWludDY0KXZvaWQiCj09CmJueiBtYWluX2w3CnR4bmEgQXBwbGljYXRpb25BcmdzIDAKcHVzaGJ5dGVzIDB4MzkwNDJhZWUgLy8gImJpZChwYXksYWNjb3VudCl2b2lkIgo9PQpibnogbWFpbl9sNgp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweGQxYTk5ZTdhIC8vICJlbmRfYXVjdGlvbigpdm9pZCIKPT0KYm56IG1haW5fbDUKZXJyCm1haW5fbDU6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KJiYKYXNzZXJ0CmNhbGxzdWIgZW5kYXVjdGlvbl80CmludGNfMSAvLyAxCnJldHVybgptYWluX2w2Ogp0eG4gT25Db21wbGV0aW9uCmludGNfMCAvLyBOb09wCj09CnR4biBBcHBsaWNhdGlvbklECmludGNfMCAvLyAwCiE9CiYmCmFzc2VydAp0eG5hIEFwcGxpY2F0aW9uQXJncyAxCmludGNfMCAvLyAwCmdldGJ5dGUKc3RvcmUgNAp0eG4gR3JvdXBJbmRleAppbnRjXzEgLy8gMQotCnN0b3JlIDMKbG9hZCAzCmd0eG5zIFR5cGVFbnVtCmludGNfMSAvLyBwYXkKPT0KYXNzZXJ0CmxvYWQgMwpsb2FkIDQKY2FsbHN1YiBiaWRfMgppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sNzoKdHhuIE9uQ29tcGxldGlvbgppbnRjXzAgLy8gTm9PcAo9PQp0eG4gQXBwbGljYXRpb25JRAppbnRjXzAgLy8gMAohPQomJgphc3NlcnQKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMQpidG9pCnN0b3JlIDEKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMgpidG9pCnN0b3JlIDIKdHhuIEdyb3VwSW5kZXgKaW50Y18xIC8vIDEKLQpzdG9yZSAwCmxvYWQgMApndHhucyBUeXBlRW51bQppbnRjXzEgLy8gcGF5Cj09CmFzc2VydApsb2FkIDAKbG9hZCAxCmxvYWQgMgpjYWxsc3ViIHN0YXJ0YXVjdGlvbl8xCmludGNfMSAvLyAxCnJldHVybgptYWluX2w4Ogp0eG4gT25Db21wbGV0aW9uCmludGNfMCAvLyBOb09wCj09CmJueiBtYWluX2wxMAplcnIKbWFpbl9sMTA6CnR4biBBcHBsaWNhdGlvbklECmludGNfMCAvLyAwCj09CmFzc2VydApjYWxsc3ViIGNyZWF0ZV8wCmludGNfMSAvLyAxCnJldHVybgoKLy8gY3JlYXRlCmNyZWF0ZV8wOgpieXRlY18zIC8vICJvd25lciIKdHhuIFNlbmRlcgphcHBfZ2xvYmFsX3B1dApieXRlY18wIC8vICJoaWdoZXN0X2JpZGRlciIKYnl0ZWMgNCAvLyAiIgphcHBfZ2xvYmFsX3B1dApieXRlY18xIC8vICJoaWdoZXN0X2JpZCIKaW50Y18wIC8vIDAKYXBwX2dsb2JhbF9wdXQKYnl0ZWNfMiAvLyAiYXVjdGlvbl9lbmQiCmludGNfMCAvLyAwCmFwcF9nbG9iYWxfcHV0CnJldHN1YgoKLy8gc3RhcnRfYXVjdGlvbgpzdGFydGF1Y3Rpb25fMToKc3RvcmUgNwpzdG9yZSA2CnN0b3JlIDUKbG9hZCA1Cmd0eG5zIFJlY2VpdmVyCmdsb2JhbCBDdXJyZW50QXBwbGljYXRpb25BZGRyZXNzCj09CmFzc2VydApsb2FkIDUKZ3R4bnMgQW1vdW50CnB1c2hpbnQgMTAwMDAwIC8vIDEwMDAwMAo9PQphc3NlcnQKYnl0ZWNfMiAvLyAiYXVjdGlvbl9lbmQiCmdsb2JhbCBMYXRlc3RUaW1lc3RhbXAKbG9hZCA3CisKYXBwX2dsb2JhbF9wdXQKYnl0ZWNfMSAvLyAiaGlnaGVzdF9iaWQiCmxvYWQgNgphcHBfZ2xvYmFsX3B1dApyZXRzdWIKCi8vIGJpZApiaWRfMjoKc3RvcmUgOQpzdG9yZSA4Cmdsb2JhbCBMYXRlc3RUaW1lc3RhbXAKYnl0ZWNfMiAvLyAiYXVjdGlvbl9lbmQiCmFwcF9nbG9iYWxfZ2V0CjwKYXNzZXJ0CmxvYWQgOApndHhucyBBbW91bnQKYnl0ZWNfMSAvLyAiaGlnaGVzdF9iaWQiCmFwcF9nbG9iYWxfZ2V0Cj4KYXNzZXJ0CmxvYWQgOApndHhucyBTZW5kZXIKdHhuIFNlbmRlcgo9PQphc3NlcnQKYnl0ZWNfMCAvLyAiaGlnaGVzdF9iaWRkZXIiCmFwcF9nbG9iYWxfZ2V0CmJ5dGVjIDQgLy8gIiIKIT0KYnogYmlkXzJfbDIKYnl0ZWNfMCAvLyAiaGlnaGVzdF9iaWRkZXIiCmFwcF9nbG9iYWxfZ2V0CmxvYWQgOQp0eG5hcyBBY2NvdW50cwo9PQphc3NlcnQKYnl0ZWNfMCAvLyAiaGlnaGVzdF9iaWRkZXIiCmFwcF9nbG9iYWxfZ2V0CmJ5dGVjXzEgLy8gImhpZ2hlc3RfYmlkIgphcHBfZ2xvYmFsX2dldApjYWxsc3ViIHBheV8zCmJpZF8yX2wyOgpieXRlY18xIC8vICJoaWdoZXN0X2JpZCIKbG9hZCA4Cmd0eG5zIEFtb3VudAphcHBfZ2xvYmFsX3B1dApieXRlY18wIC8vICJoaWdoZXN0X2JpZGRlciIKbG9hZCA4Cmd0eG5zIFNlbmRlcgphcHBfZ2xvYmFsX3B1dApyZXRzdWIKCi8vIHBheQpwYXlfMzoKc3RvcmUgMTEKc3RvcmUgMTAKaXR4bl9iZWdpbgppbnRjXzEgLy8gcGF5Cml0eG5fZmllbGQgVHlwZUVudW0KbG9hZCAxMAppdHhuX2ZpZWxkIFJlY2VpdmVyCmxvYWQgMTEKaXR4bl9maWVsZCBBbW91bnQKaW50Y18wIC8vIDAKaXR4bl9maWVsZCBGZWUKaXR4bl9zdWJtaXQKcmV0c3ViCgovLyBlbmRfYXVjdGlvbgplbmRhdWN0aW9uXzQ6Cmdsb2JhbCBMYXRlc3RUaW1lc3RhbXAKYnl0ZWNfMiAvLyAiYXVjdGlvbl9lbmQiCmFwcF9nbG9iYWxfZ2V0Cj4KYXNzZXJ0CmJ5dGVjXzMgLy8gIm93bmVyIgphcHBfZ2xvYmFsX2dldApieXRlY18xIC8vICJoaWdoZXN0X2JpZCIKYXBwX2dsb2JhbF9nZXQKY2FsbHN1YiBwYXlfMwpieXRlY18yIC8vICJhdWN0aW9uX2VuZCIKaW50Y18wIC8vIDAKYXBwX2dsb2JhbF9wdXQKYnl0ZWNfMyAvLyAib3duZXIiCmJ5dGVjXzAgLy8gImhpZ2hlc3RfYmlkZGVyIgphcHBfZ2xvYmFsX2dldAphcHBfZ2xvYmFsX3B1dApieXRlY18wIC8vICJoaWdoZXN0X2JpZGRlciIKYnl0ZWMgNCAvLyAiIgphcHBfZ2xvYmFsX3B1dApyZXRzdWI='
  override clearProgram: string = 'I3ByYWdtYSB2ZXJzaW9uIDcKcHVzaGludCAwIC8vIDAKcmV0dXJu'
  override methods: algosdk.ABIMethod[] = [
    new algosdk.ABIMethod({ name: 'start_auction', desc: '', args: [{ type: 'pay', name: 'payment', desc: '' }, { type: 'uint64', name: 'starting_price', desc: '' }, { type: 'uint64', name: 'length', desc: '' }], returns: { type: 'void', desc: '' } }),
    new algosdk.ABIMethod({ name: 'bid', desc: '', args: [{ type: 'pay', name: 'payment', desc: '' }, { type: 'account', name: 'previous_bidder', desc: '' }], returns: { type: 'void', desc: '' } }),
    new algosdk.ABIMethod({ name: 'end_auction', desc: '', args: [], returns: { type: 'void', desc: '' } })
  ]

  async start_auction (args: {
        payment: algosdk.TransactionWithSigner | algosdk.Transaction;
        starting_price: bigint;
        length: bigint;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
    const result = await this.call(algosdk.getMethodByName(this.methods, 'start_auction'), { payment: args.payment, starting_price: args.starting_price, length: args.length }, txnParams)
    return new bkr.ABIResult<void>(result)
  }

  async bid (args: {
        payment: algosdk.TransactionWithSigner | algosdk.Transaction;
        previous_bidder: string;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
    const result = await this.call(algosdk.getMethodByName(this.methods, 'bid'), { payment: args.payment, previous_bidder: args.previous_bidder }, txnParams)
    return new bkr.ABIResult<void>(result)
  }

  async end_auction (txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
    const result = await this.call(algosdk.getMethodByName(this.methods, 'end_auction'), {}, txnParams)
    return new bkr.ABIResult<void>(result)
  }
}
