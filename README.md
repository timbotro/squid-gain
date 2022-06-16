## Overview
|Title|SquidGain|
|----|----|
|Hackathon|[amsterDOT Hack](https://dorahacks.io/hackathon/22/detail)|
|Bounty Name|[SubSquid: Karura Defi Dashboard](https://github.com/subsquid/community/issues/7)|
|Summary|DeFi Dashboard for Karura DEX|
|Website|Dashboard|
|Video|youtube|


## Instructions
> :information_source: NPM 8+ required for this repo. Consider using `nvm` to manage multiple versions if you require legacy support.

1) Clone repo and run: `npm i`
2) Bring up DB docker container: `make up`
3) Define DB: `make migrate`
4) Run the Squid: `bash scripts/docker-run.sh`
5) Run the GraphQL server: `make serve`

## Queries
> :information_source: A longer list of queries can be found here: [SquidGain Queries](https://hackmd.io/FfIG5fErSjiS2YKvNYv6-A)
### Overall Stats
```
query MyQuery {
  overviewHistories(orderBy: timestamp_DESC) {
    totalVolumeDay
    totalLiquidity
    timestamp
  }
}
```
This is day aggregated stats for all all Native Asset pairs.

### Historic Prices
```
query MyQuery {
  currPrices(where: {currency: {currencyName_containsInsensitive: "KSM", currencyName_not_contains: "LKSM"}}) {
    usdPrice
    timestamp
    currency {
      currencyName
      decimals
    }
  }
}
```
This will return on-chain prices of a particular token based on the pool depths at the timestamp. Updated hourly.
### Pool Liquidities
```
query MyQuery {
  poolLiquidities(orderBy: timestamp_DESC) {
    usdTotalLiquidity
    token1Liquidity
    token0Liquidity
    timestamp
    pool {
      currency0
      currency1
    }
  }
}
```
This will return the liquidities for a pool and the associated USD value for that time.

## Caveats & Roadmap
- Limited currency support, will support ForeignAssets and StableAssets soon
