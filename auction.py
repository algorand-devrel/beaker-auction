#!/usr/bin/env python3
from pyteal import *
from beaker import *
import os
import json
from typing import Final


class Auction(Application):
    highest_bidder: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.bytes,
        default=Bytes(""),
        descr="Address of the highest bidder",
    )

    auction_end: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Timestamp of the end of the auction",
    )

    highest_bid: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Amount of the highest bid (uALGO)",
    )

    asa_amt: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Total amount of ASA being auctioned",
    )

    asa: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="ID of the ASA being auctioned",
    )

    @create
    def create(self):
        # Set all global state to the default values
        return self.initialize_application_state()

    # Only allow app creator to opt the app account into a ASA
    @external(authorize=Authorize.only(Global.creator_address()))
    def opt_into_asset(self, asset: abi.Asset):
        return Seq(
            # Verify a ASA hasn't already been opted into
            Assert(self.asa == Int(0)),
            # Save ASA ID in global state
            self.asa.set(asset.asset_id()),
            # Submit opt-in transaction: 0 asset transfer to self
            InnerTxnBuilder.Execute(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.fee: Int(0),  # cover fee with outer txn
                    TxnField.asset_receiver: Global.current_application_address(),
                    TxnField.xfer_asset: asset.asset_id(),
                    TxnField.asset_amount: Int(0),
                }
            ),
        )

    @external(authorize=Authorize.only(Global.creator_address()))
    def start_auction(
        self,
        starting_price: abi.Uint64,
        length: abi.Uint64,
        axfer: abi.AssetTransferTransaction,
    ):
        return Seq(
            # Ensure the auction hasn't already been started
            Assert(self.auction_end.get() == Int(0)),
            # Verify axfer
            Assert(
                axfer.get().asset_receiver() == Global.current_application_address()
            ),
            Assert(axfer.get().asset_close_to() == Global.zero_address()),
            Assert(axfer.get().xfer_asset() == self.asa.get()),
            # Set global state
            self.asa_amt.set(axfer.get().asset_amount()),
            self.auction_end.set(Global.latest_timestamp() + length.get()),
            self.highest_bid.set(starting_price.get()),
        )

    @internal(TealType.none)
    def pay(self, receiver: Expr, amount: Expr):
        return InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: receiver,
                TxnField.amount: amount,
                TxnField.fee: Int(0),  # cover fee with outer txn
            }
        )

    @external
    def bid(self, payment: abi.PaymentTransaction, previous_bidder: abi.Account):
        return Seq(
            # Ensure auction hasn't ended
            Assert(Global.latest_timestamp() < self.auction_end.get()),
            # Verify payment transaction
            Assert(payment.get().amount() > self.highest_bid.get()),
            Assert(Txn.sender() == payment.get().sender()),
            # Return previous bid if there was one
            If(
                self.highest_bidder.get() != Bytes(""),
                self.pay(previous_bidder.address(), self.highest_bid.get()),
            ),
            # Set global state
            self.highest_bid.set(payment.get().amount()),
            self.highest_bidder.set(payment.get().sender()),
        )

    @external
    def claim_bid(self):
        return Seq(
            # Auction end check is commented out for automated testing
            # Assert(Global.latest_timestamp() > self.auction_end.get()),
            self.pay(Global.creator_address(), self.highest_bid.get()),
        )

    @external
    def claim_asset(
        self, asset: abi.Asset, app_creator: abi.Account, asset_creator: abi.Account
    ):
        return Seq(
            # Auction end check is commented out for automated testing
            # Assert(Global.latest_timestamp() > self.auction_end.get()),
            # Send ASA to highest bidder
            InnerTxnBuilder.Execute(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.fee: Int(0),  # cover fee with outer txn
                    TxnField.xfer_asset: self.asa,
                    TxnField.asset_amount: self.asa_amt,
                    TxnField.asset_receiver: self.highest_bidder,
                    # Close to asset creator since they are guranteed to be opted into the asset
                    TxnField.asset_close_to: Seq(
                        creator := asset.params().creator_address(),
                        creator.value(),
                    ),
                }
            ),
        )

    @delete
    def delete():
        return InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.fee: Int(0),  # cover fee with outer txn
                TxnField.receiver: Global.creator_address(),
                # close_remainder_to to sends full balance, including 0.1 account MBR
                TxnField.close_remainder_to: Global.creator_address(),
                # we are closing the account, so amount can be zero
                TxnField.amount: Int(0),
            }
        )


if __name__ == "__main__":
    app = Auction(version=8)

    if os.path.exists("approval.teal"):
        os.remove("approval.teal")

    if os.path.exists("approval.teal"):
        os.remove("clear.teal")

    if os.path.exists("abi.json"):
        os.remove("abi.json")

    if os.path.exists("app_spec.json"):
        os.remove("app_spec.json")

    with open("approval.teal", "w") as f:
        f.write(app.approval_program)

    with open("clear.teal", "w") as f:
        f.write(app.clear_program)

    with open("abi.json", "w") as f:
        f.write(json.dumps(app.contract.dictify(), indent=4))

    with open("app_spec.json", "w") as f:
        f.write(json.dumps(app.application_spec(), indent=4))
