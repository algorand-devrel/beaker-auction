#!/usr/bin/env python3
from pyteal import *
from beaker import *
import os
import json
from typing import Final


class Auction(Application):
    owner: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.bytes, default=Global.creator_address()
    )
    highest_bidder: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.bytes, default=Bytes("")
    )

    auction_end: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )
    highest_bid: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64, default=Int(0)
    )

    @internal(TealType.none)
    def pay(self, receiver: Expr, amount: Expr):
        return InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: receiver,
                TxnField.amount: amount,
                TxnField.fee: Int(0),
            }
        )

    @create
    def create(self):
        return self.initialize_application_state()

    @external(authorize=Authorize.only(owner))
    def start_auction(
        self,
        payment: abi.PaymentTransaction,
        starting_price: abi.Uint64,
        length: abi.Uint64,
    ):
        return Seq(
            # Verify payment txn
            Assert(payment.get().receiver() == Global.current_application_address()),
            Assert(payment.get().amount() == Int(100_000)),
            # Set global state
            self.auction_end.set(Global.latest_timestamp() + length.get()),
            self.highest_bid.set(starting_price.get()),
        )

    @external
    def bid(self, payment: abi.PaymentTransaction, previous_bidder: abi.Account):
        return Seq(
            Assert(Global.latest_timestamp() < self.auction_end.get()),
            # Verify payment transaction
            Assert(payment.get().amount() > self.highest_bid.get()),
            Assert(Txn.sender() == payment.get().sender()),
            # Return previous bid
            If(
                self.highest_bidder.get() != Bytes(""),
                Seq(
                    Assert(self.highest_bidder.get() == previous_bidder.address()),
                    self.pay(self.highest_bidder.get(), self.highest_bid.get()),
                ),
            ),
            # Set global state
            self.highest_bid.set(payment.get().amount()),
            self.highest_bidder.set(payment.get().sender()),
        )

    @external
    def end_auction(self):
        return Seq(
            Assert(Global.latest_timestamp() > self.auction_end.get()),
            self.pay(self.owner.get(), self.highest_bid.get()),
            self.owner.set(self.highest_bidder.get()),
            self.auction_end.set_default(),
            self.highest_bidder.set_default(),
        )


if __name__ == "__main__":
    app = Auction(version=7)

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
