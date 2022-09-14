from beaker import *
from auction import *
from algosdk import transaction
from algosdk.encoding import encode_address
from algosdk.atomic_transaction_composer import TransactionWithSigner
import pytest

MIN_FEE = 1_000

@pytest.fixture(scope="module")
def create_app():
    global accounts
    global creator_acct
    global app_client
    accounts = sorted(
        sandbox.get_accounts(),
        key=lambda a: sandbox.clients.get_algod_client().account_info(a.address)[
            "amount"
        ],
    )

    creator_acct = accounts.pop()

    app_client = client.ApplicationClient(
        client=sandbox.get_algod_client(),
        app=Auction(version=6),
        signer=creator_acct.signer,
    )

    app_client.create()

@pytest.fixture(scope="module")
def start_auction():
    sp = app_client.get_suggested_params()

    pay_txn = TransactionWithSigner(
        txn=transaction.PaymentTxn(
            sender=creator_acct.address,
            receiver=app_client.app_addr,
            amt=100_000,
            fee=sp.fee,
            first=sp.first,
            last=sp.last,
            gh=sp.gh,
        ),
        signer=creator_acct.signer,
    )

    app_client.call(
        Auction.start_auction, payment=pay_txn, starting_price=10_000, length=36_000
    )

@pytest.fixture(scope="module")
def send_first_bid():
    global first_bidder
    first_bidder = accounts.pop()

    sp = app_client.get_suggested_params()

    pay_txn = TransactionWithSigner(
        txn=transaction.PaymentTxn(
            sender=first_bidder.address,
            receiver=app_client.app_addr,
            amt=20_000,
            fee=sp.fee,
            first=sp.first,
            last=sp.last,
            gh=sp.gh,
        ),
        signer=first_bidder.signer,
    )

    app_client.call(Auction.bid, payment=pay_txn, signer=first_bidder.signer)

@pytest.fixture(scope="module")
def send_second_bid():
    global second_bidder
    global first_bidder_amount
    second_bidder = accounts.pop()

    sp = app_client.get_suggested_params()
    first_bidder_amount = app_client.client.account_info(first_bidder.address)["amount"]

    pay_txn = TransactionWithSigner(
        txn=transaction.PaymentTxn(
            sender=second_bidder.address,
            receiver=app_client.app_addr,
            amt=30_000,
            fee=MIN_FEE*2,
            first=sp.first,
            last=sp.last,
            gh=sp.gh,
        ),
        signer=second_bidder.signer,
    )

    app_client.call(
        Auction.bid,
        payment=pay_txn,
        signer=second_bidder.signer,
        accounts=[first_bidder.address],
    )

##############
# create tests
##############

@pytest.mark.create
def test_create_owner(create_app):
    addr = bytes.fromhex(app_client.get_application_state()["owner"])
    assert encode_address(addr) == creator_acct.address

@pytest.mark.create
def test_create_highest_bidder(create_app):
    assert app_client.get_application_state()["highest_bidder"] == ""

@pytest.mark.create
def test_create_highest_bid(create_app):
    assert app_client.get_application_state()["highest_bid"] == 0

@pytest.mark.create
def test_create_auction_end(create_app):
    assert app_client.get_application_state()["auction_end"] == 0

#####################
# start_auction tests
#####################

@pytest.mark.start_auction
def test_start_auction_end(create_app, start_auction):
    assert app_client.get_application_state()["auction_end"] != 0

@pytest.mark.start_auction
def test_start_auction_highest_bid(create_app, start_auction):
    assert app_client.get_application_state()["highest_bid"] == 10_000

#################
# first_bid tests
#################

@pytest.mark.first_bid
def test_first_bid_highest_bid(create_app, start_auction, send_first_bid):
    assert app_client.get_application_state()["highest_bid"] == 20_000

@pytest.mark.first_bid
def test_first_bid_highest_bidder(create_app, start_auction, send_first_bid):
    addr = bytes.fromhex(app_client.get_application_state()["highest_bidder"])
    assert encode_address(addr) == first_bidder.address

##################
# second_bid tests
##################

@pytest.mark.second_bid
def test_second_bid_highest_bid(
    create_app, start_auction, send_first_bid, send_second_bid
):
    assert app_client.get_application_state()["highest_bid"] == 30_000


@pytest.mark.second_bid
def test_second_bid_highest_bidder(
    create_app, start_auction, send_first_bid, send_second_bid
):
    addr = bytes.fromhex(app_client.get_application_state()["highest_bidder"])
    assert encode_address(addr) == second_bidder.address

@pytest.mark.second_bid
def test_second_bid_first_bidder_balance(
    create_app, start_auction, send_first_bid, send_second_bid
):
    assert (
        app_client.client.account_info(first_bidder.address)["amount"]
        == first_bidder_amount + 20_000
    )

@pytest.mark.second_bid
def test_second_bid_app_balance(
    create_app, start_auction, send_first_bid, send_second_bid
):
    assert (
        app_client.client.account_info(app_client.app_addr)["amount"]
        == 30_000 + 100_000
    )
