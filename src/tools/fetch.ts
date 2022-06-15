import {
  Store,
  SubstrateEvent,
  EventHandlerContext,
  SubstrateBlock,
  BlockHandlerContext,
} from '@subsquid/substrate-processor'
import {} from '@subsquid/substrate-processor'
import { startOfDay, startOfHour } from 'date-fns'
import { nativeTokens } from '../static/tokens'

import { Currency, CurrPrice } from '../model/generated'
import { acala } from '../mappings/api'
import { nativeTokenDecimals } from '../static/decimals'
import { getApi } from '../mappings/newApi'

const api = acala()

export async function getPrice(ctx: EventHandlerContext | BlockHandlerContext, currency: Currency, date: Date) {
  const timestamp = startOfHour(date)
  try {
    return await ctx.store.findOneOrFail<CurrPrice>(CurrPrice, { currency, timestamp })
  } catch {
    const price = await createPrice(currency, ctx.block.hash)
    const currPrice = new CurrPrice({ id: ctx.block.id + currency.currencyName, currency, timestamp, usdPrice: price })
    await ctx.store.save(currPrice)
    return currPrice
  }
}

async function createPrice(currency: Currency, hash: string): Promise<number> {
  switch (currency.currencyName) {
    case 'KUSD':
      return 1.0
    case 'KAR':
      return await getKarPrice(hash)
    default:
      return await getNativePrice(hash, currency.currencyName)
  }
}

//use trading paths
async function getNativePrice(hash: string, curr: string) {
  const api = await getApi()
  const resp = await api.getPoolDepths(hash, { Token: 'KUSD' }, { Token: curr })

  //@ts-ignore
  const dpDiff = nativeTokenDecimals.KUSD - nativeTokenDecimals[curr]
  const price = Number(resp[0] / resp[1]) / 10 ** dpDiff

  return price
}

async function getKarPrice(hash: string) {
  const apiAt = await (await api).at(hash)
  const resp = (await apiAt.query.dex.liquidityPool([nativeTokens.kar, nativeTokens.kusd])).toJSON() as any
  const price = Number(resp[0] / resp[1])
  return price
}
