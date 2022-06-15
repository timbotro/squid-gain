// import { CurrencyId, CurrencyId_Token } from '../types/v2041'
import * as types from '../types/events'
import { Store, SubstrateEvent, EventHandlerContext, SubstrateBlock } from '@subsquid/substrate-processor'
import {} from '@subsquid/substrate-processor'
import { startOfDay } from 'date-fns'
import assert from 'assert'
import { Block } from '@polkadot/types/interfaces'
import { Currency, CurrLiquidity, CurrVolumeDay, LiquidityChange, LiquidityChangeReason } from '../model/generated'
import * as v1000 from '../types/v1000'
import * as v1008 from '../types/v1008'
import * as v1009 from '../types/v1009'
import * as v1019 from '../types/v1019'
import * as v2001 from '../types/v2001'
import * as v2010 from '../types/v2010'
import * as v2011 from '../types/v2011'
import * as v2022 from '../types/v2022'
// import * as v2041 from '../types/v2041'
import { DateTime } from '@subsquid/graphql-server'
import { getPrice } from '../tools/fetch'
import { acala } from '../mappings/api'
import { nativeTokenDecimals } from '../static/decimals'
import { ApiPromise } from '@polkadot/api'

// export async function getDecimals(tokenSymbol: string): Promise<number> {
//   const api: ApiPromise = await acala()
//   const response = (
//     await api.query.assetRegistry.assetMetadatas({ NativeAssetId: { Token: tokenSymbol } })
//   ).toJSON() as any
//   //   console.log(response.decimals)
//   return response.decimals
// }

export function getDecimals(tokenName: string): number {
  // @ts-ignore
  return nativeTokenDecimals[tokenName]
}
