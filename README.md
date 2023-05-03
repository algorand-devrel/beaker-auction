This repo was initialized with algokit and contains the following:

1. [An auction smart contract](app.py) written with [PyTeal](https://github.com/algorand/pyteal) and [Beaker](https://github.com/algorand-devrel/beaker)
2. [Python Tests](test_app.py) written with [Beaker](https://github.com/algorand-devrel/beaker) and [pytest](https://docs.pytest.org/en/7.1.x/)
3. A web-based [front-end](web/) written with [js-algorand-sdk](https://github.com/algorand-devrel/beaker) and [algokit-utils-ts](https://github.com/algorandfoundation/algokit-utils-ts/) (based on [algo-web-template](https://github.com/algorand-devrel/algo-web-template))

# Install python dependencies

`algokit bootstrap all`


# Usage

## Compile Contract

`poetry run python app.py`

## Python Tests (PyTest)

`poetry run pytest`

## Web Front End

1. `cd web/`
2. `npm run serve` to serve and open web app

To use the app you must have at least one account in Pera funded on testnet. You can get testnet funds [here](https://bank.testnet.algorand.network/)
