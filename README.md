This repo contains 
1. [An auction smart contract](auction.py) written with [PyTeal](https://github.com/algorand/pyteal) and [Beaker](https://github.com/algorand-devrel/beaker)
2. [Tests](test_auction.py) written with [Beaker](https://github.com/algorand-devrel/beaker) and [pytest](https://docs.pytest.org/en/7.1.x/)
3. A web-based [front-end](web/) written with [js-algorand-sdk](https://github.com/algorand-devrel/beaker) and [Beaker-ts](https://github.com/algorand-devrel/beaker-ts) (based on [algo-web-template](https://github.com/algorand-devrel/algo-web-template))

# Usage

## Install python dependencies

1. `python -m venv .venv` and `source .venv/bin/activate` to create a virtual environment to install python dependencies
2. `pip3 install -r requirements.txt` to install python dependencies

## Web-Based Front End

1. `cd web/`
2. `npm i` to install the nodeJS dependencies
3. `npm run beaker` to compile the smart contract and generate the typescript class for the beaker application
4. `npm run serve` to serve and open web app

To use the app you must have at least one account in MyAlgo funded on testnet. You can get testnet funds [here](https://bank.testnet.algorand.network/)

## Tests

1. `source .venv/bin/activate`
2. `pip3 install -r requirements.txt` to install python dependencies
3. `pytest` to execute tests
