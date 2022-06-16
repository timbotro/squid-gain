import { CurrencyId, CurrencyId_Token } from '../types/v2041'
import * as types from '../types/events'
import { DexLiquidityPoolStorage } from '../types/storage'
import { Store, SubstrateEvent, EventHandlerContext, SubstrateBlock, BlockHandlerContext } from '@subsquid/substrate-processor'
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
import * as v2041 from '../types/v2041'
import { DateTime } from '@subsquid/graphql-server'
import { getPrice } from '../tools/fetch'
import { getDecimals } from '../tools/decimals'
import { nativeTokenDecimals } from '../static/decimals'

export type EntityConstructor<T> = {
  new (...args: any[]): T
}

export async function get<T extends { id: string }>(
  store: Store,
  EntityConstructor: EntityConstructor<T>,
  id: string
): Promise<T | undefined> {
  let entity = await store.get<T>(EntityConstructor, {
    where: { id },
  })
  return entity
}
export async function getCurrency(ctx: EventHandlerContext|BlockHandlerContext, tokenName: string): Promise<Currency> {
  try {
    return await ctx.store.findOneOrFail<Currency>(Currency, { where: { currencyName: tokenName } })
  } catch {
    const decimals = getDecimals(tokenName)
    const curr = new Currency({ id: ctx.block.id + tokenName, currencyName: tokenName, decimals })
    await ctx.store.save(curr)
    return curr
  }
}

export async function getCurrVolumeDay(
  ctx: EventHandlerContext,
  currency: Currency,
  timestamp: Date
): Promise<CurrVolumeDay> {
  try {
    return await ctx.store.findOneOrFail<CurrVolumeDay>(CurrVolumeDay, { currency, timestamp })
  } catch {
    const curr = new CurrVolumeDay({
      id: ctx.event.id,
      currency,
      timestamp,
      volumeDayNative: 0n,
      volumeDayUSD: Number(0),
    })
    await ctx.store.save(curr)
    return curr
  }
}

export async function getCurrLiquidity(
  ctx: EventHandlerContext,
  currency: Currency,
  timestamp: Date
): Promise<CurrLiquidity> {
  try {
    return await ctx.store.findOneOrFail<CurrLiquidity>(CurrLiquidity, { currency, timestamp })
  } catch {
    const curr = new CurrLiquidity({
      id: ctx.event.id,
      currency,
      timestamp,
      liquidity: 0n,
      liquidityUSD: Number(0),
    })
    await ctx.store.save(curr)
    return curr
  }
}

export async function getLiquidityPool(ctx: EventHandlerContext|BlockHandlerContext, key: [CurrencyId, CurrencyId]): Promise<[bigint, bigint]> {
  const storage = new DexLiquidityPoolStorage(ctx)
  if (storage.isV1008) {
    const balances = storage.getAsV1008(key as [v1008.CurrencyId, v1008.CurrencyId])
    return balances
  }
  if (storage.isV1009) {
    const balances = storage.getAsV1009(key as [v1009.CurrencyId, v1009.CurrencyId])
    return balances
  }
  if (storage.isV1019) {
    const balances = storage.getAsV1019(key as [v1019.CurrencyId, v1019.CurrencyId])
    return balances
  }
  if (storage.isV2001) {
    const balances = storage.getAsV2001(key as [v2001.CurrencyId, v2001.CurrencyId])
    return balances
  }
  if (storage.isV2010) {
    const balances = storage.getAsV2010(key as [v2001.CurrencyId, v2001.CurrencyId])
    return balances
  }
  if (storage.isV2011) {
    const balances = storage.getAsV2011(key as [v2011.CurrencyId, v2011.CurrencyId])
    return balances
  }
  if (storage.isV2022) {
    const balances = storage.getAsV2022(key as [v2022.CurrencyId, v2022.CurrencyId])
    return balances
  }
  const balances = storage.getAsV2041(key as [v2041.CurrencyId, v2041.CurrencyId])
  return balances
}

export async function addLiquidityChange(
  ctx: EventHandlerContext,
  reason: LiquidityChangeReason,
  currency0: CurrencyId_Token,
  currency1: CurrencyId_Token,
  amount0: bigint,
  amount1: bigint,
  swapStep?: number
): Promise<void> {
  const { store, event, block } = ctx
  let pair = currency0.value.__kind + '-' + currency1.value.__kind
  let initial = await get(store, LiquidityChange, 'initial--' + pair)

  if (initial == null) {
    let [b0, b1]: [bigint, bigint] = await getLiquidityPool(ctx, [currency0, currency1])

    //let parentBlock = await (ctx._chain as any).client.call("chain_getBlock",[block.parentHash]) as any
    initial = new LiquidityChange()
    initial.id = 'initial--' + pair
    initial.timestamp = BigInt(block.timestamp - 1)
    initial.blockNumber = block.height - 1
    initial.eventIdx = -1
    initial.step = 0
    initial.reason = LiquidityChangeReason.INIT
    initial.currencyZero = currency0.value.__kind
    initial.currencyOne = currency1.value.__kind
    initial.amountZero = 0n
    initial.amountOne = 0n
    initial.balanceZero = b0
    initial.balanceOne = b1
    await store.save(initial)
  }

  let balance = await getPrevBalance(store, currency0, currency1)
  const newBal0 = balance[0] + amount0
  const newBal1 = balance[1] + amount1
  let change = new LiquidityChange()
  change.id = swapStep ? event.id + '-' + swapStep : event.id
  change.timestamp = BigInt(block.timestamp)
  change.blockNumber = block.height
  change.eventIdx = event.indexInBlock
  change.step = swapStep || 0
  change.reason = reason
  change.currencyZero = currency0.value.__kind
  change.currencyOne = currency1.value.__kind
  change.amountZero = amount0
  change.amountOne = amount1
  change.balanceZero = newBal0
  change.balanceOne = newBal1
  await store.save(change)

  const ccy0 = await getCurrency(ctx, currency0.value.__kind)
  const ccy1 = await getCurrency(ctx, currency1.value.__kind)
  await updateGlobalLiquidities(ctx, ccy0, newBal0)
  await updateGlobalLiquidities(ctx, ccy1, newBal1)
}

export async function updateGlobalVolumes(ctx: EventHandlerContext, curr: Currency, amount: bigint) {
  const blockDate = new Date(ctx.block.timestamp)
  const date = startOfDay(blockDate)
  const currVolDay = await getCurrVolumeDay(ctx, curr, date)
  const volChange = await calcUsdVal(ctx, curr, amount, blockDate)

  currVolDay.volumeDayNative = currVolDay.volumeDayNative! + amount
  currVolDay.volumeDayUSD = numberConvert(currVolDay, "volumeDayUSD") + volChange
  await ctx.store.save(currVolDay)

}

export async function updateGlobalLiquidities(ctx: EventHandlerContext, curr: Currency, liquidity: bigint) {
  const blockDate = new Date(ctx.block.timestamp)
  const date = startOfDay(blockDate)
  const currLiquidity = await getCurrLiquidity(ctx, curr, date)
  const liquidityValue = await calcUsdVal(ctx, curr, liquidity, blockDate)
  currLiquidity.liquidity = liquidity
  currLiquidity.liquidityUSD = liquidityValue

  await ctx.store.save(currLiquidity)
}

export async function calcUsdVal(ctx: EventHandlerContext|BlockHandlerContext, curr: Currency, amt: number | bigint, date: Date) {
  const decimals = getDecimals(curr.currencyName)
  const currentPrice = await getPrice(ctx, curr, date)
  const volChange = (numberConvert(currentPrice, "usdPrice") * Number(amt)) / 10 ** decimals
  return volChange
}

async function getPrevBalance(
  store: Store,
  currency0: CurrencyId_Token,
  currency1: CurrencyId_Token
): Promise<[bigint, bigint]> {
  const ccy0 = currency0.value.__kind
  const ccy1 = currency1.value.__kind
  let rows = await store.find(LiquidityChange, {
    select: ['balanceZero', 'balanceOne'],
    where: {
      currencyZero: ccy0,
      currencyOne: ccy1,
    },
    order: {
      blockNumber: 'DESC',
      eventIdx: 'DESC',
      step: 'DESC',
    },
    take: 1,
  })
  assert(rows.length == 1)
  return [rows[0].balanceZero, rows[0].balanceOne]
}

export function bigIntConvert(section: any, call: any): bigint {
  try {
    return BigInt(Number(section[call]).toFixed(0))
  } catch {
    return BigInt(0)
  }
}
export function numberConvert(section: any, call: any): number {
  try {
    return Number(section[call])
  } catch {
    return 0
  }
}