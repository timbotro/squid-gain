import primitivesConfig from '@acala-network/type-definitions/primitives'
import { BlockHandlerContext, EventHandlerContext, Store } from '@subsquid/substrate-processor'
import { DexSwapEvent } from '../types/events'
import { calcUsdVal, getLiquidityPool } from './utility'
import { Currency, OverviewHistory, Pool, PoolLiquidity, PoolVolumeDay } from '../model/generated'
import { addLiquidityChange, getCurrency, updateGlobalLiquidities, updateGlobalVolumes } from './utility'
import { startOfDay, startOfHour } from 'date-fns'
import { StorageContext } from '../types/support'
import { DexLiquidityPoolStorage } from '../types/storage'
import { getPrice } from '../tools/fetch'
import { getDecimals } from '../tools/decimals'
import { stat } from 'fs'
import { tradingPairs } from '../static/tradingPairs'
import { getApi } from './newApi'
import { start } from 'repl'

let lastStateTimestamp = 0
let lastOverviewTimestamp = 0

export async function handlePoolData(ctx: BlockHandlerContext) {
  if (lastStateTimestamp == 0) {
    const lastPoolLiquidity = await getLastPoolLiquidity(ctx.store)
    if (lastPoolLiquidity) lastStateTimestamp = lastPoolLiquidity.timestamp!.getTime()
  }

  const formattedDate = startOfHour(new Date(lastStateTimestamp))
  const blockDate = startOfHour(new Date(ctx.block.timestamp))

  if (formattedDate.getTime() == blockDate.getTime()) return

  for (let i = 0; i < tradingPairs.length; i++) {
    const ccy0 = tradingPairs[i][0]
    const ccy1 = tradingPairs[i][1]
    const api = await getApi()
    const depths = await api.getPoolDepths(ctx.block.hash, ccy0, ccy1)
    await updatePoolLiquidity(ctx, ccy0.Token, ccy1.Token, depths[0], depths[1])
  }

  lastStateTimestamp = ctx.block.timestamp
  return
}

export async function handleDailyStats(ctx: BlockHandlerContext) {
  if (lastOverviewTimestamp == 0) {
    const lastOverviewHistory = await getLastOverviewHistory(ctx.store)
    lastOverviewTimestamp = lastOverviewHistory ? lastOverviewHistory.timestamp!.getTime() : ctx.block.timestamp
  }

  const formattedDate = startOfDay(new Date(lastOverviewTimestamp))
  const blockDate = startOfDay(new Date(ctx.block.timestamp))

  if (formattedDate.getTime() == blockDate.getTime()) return

  if (blockDate.getTime() > formattedDate.getTime()) {
    const overviewHistory = await getOverviewHistory(ctx, formattedDate)
    for (let i = 0; i < tradingPairs.length; i++) {
      const ccy0 = tradingPairs[i][0]
      const ccy1 = tradingPairs[i][1]
      const pool = await getPool(ctx, ccy0.Token, ccy1.Token)
      const poolVol = await getDailyPoolVol(ctx, pool, formattedDate)
      const poolLiquidity = await getPoolLiquidity(ctx, pool)
      overviewHistory.totalLiquidity =
        BigInt(overviewHistory.totalLiquidity!) + bigIntConvert(poolLiquidity, "usdTotalLiquidity")
      overviewHistory.totalVolumeDay = BigInt(overviewHistory.totalVolumeDay!) + bigIntConvert(poolVol,"volumeDayUSD")
    }

    await ctx.store.save(overviewHistory)
    lastOverviewTimestamp = ctx.block.timestamp
    return
  }
}

function bigIntConvert(section: any, call: any): bigint {
  try {
    return BigInt(Number(section[call]).toFixed(0))
  } catch {
    return BigInt(0)
  }
}

async function getOverviewHistory(ctx: BlockHandlerContext, date: Date) {
  const timestamp = startOfDay(date)
  try {
    return await ctx.store.findOneOrFail<OverviewHistory>(OverviewHistory, { timestamp })
  } catch {
    const dailyOverview = new OverviewHistory({
      id: ctx.block.id + date.getTime(),
      totalLiquidity: BigInt(0),
      totalVolumeDay: BigInt(0),
      timestamp,
    })
    await ctx.store.save(dailyOverview)
    return dailyOverview
  }
}

async function getLastOverviewHistory(store: Store) {
  return await store.findOne(OverviewHistory, {}, { order: { timestamp: 'DESC' } })
}

async function getLastPoolLiquidity(store: Store) {
  return await store.findOne(PoolLiquidity, {}, { order: { timestamp: 'DESC' } })
}

async function getPool(ctx: BlockHandlerContext | EventHandlerContext, ccy0: string, ccy1: string): Promise<Pool> {
  const ordered = getOrderedPool(ccy0, ccy1)

  try {
    return await ctx.store.findOneOrFail<Pool>(Pool, {
      currency0: ordered[0],
      currency1: ordered[1],
    })
  } catch {
    const pool = new Pool({ id: ctx.block.id, currency0: ordered[0], currency1: ordered[1] })
    await ctx.store.save(pool)
    return pool
  }
}

async function getPoolVolume(ctx: BlockHandlerContext | EventHandlerContext, pool: Pool): Promise<PoolVolumeDay> {
  const blockDate = new Date(ctx.block.timestamp)
  const timestamp = startOfDay(blockDate)
  try {
    return await ctx.store.findOneOrFail<PoolVolumeDay>(PoolVolumeDay, { where: { pool: pool, timestamp: timestamp } })
  } catch {
    const poolVol = new PoolVolumeDay({
      id: ctx.block.id + pool.id,
      pool: pool,
      volumeDayUSD: 0,
      timestamp: timestamp,
    })
    await ctx.store.save(poolVol)
    return poolVol
  }
}

export async function updatePoolVolume(
  ctx: EventHandlerContext | BlockHandlerContext,
  curr0: Currency,
  curr1: Currency,
  fromAmount: bigint
) {
  const pool = await getPool(ctx, curr0.currencyName, curr1.currencyName)
  const poolVol = await getPoolVolume(ctx, pool)
  const blockDate = new Date(ctx.block.timestamp)
  const val = await calcUsdVal(ctx, curr0, fromAmount, blockDate)
  poolVol!.volumeDayUSD = Number(poolVol!.volumeDayUSD!) + Number(val)
  poolVol!.timestamp = startOfDay(new Date(ctx.block.timestamp))
  await ctx.store.save(poolVol)
}

async function getPoolLiquidity(ctx: BlockHandlerContext | EventHandlerContext, pool: Pool): Promise<PoolLiquidity> {
  const blockDate = new Date(ctx.block.timestamp)
  const timestamp = startOfDay(blockDate)
  try {
    return await ctx.store.findOneOrFail<PoolLiquidity>(PoolLiquidity, { where: { pool, timestamp } })
  } catch {
    const uid = ctx.block.id + pool.currency0 + pool.currency1
    const poolVol = new PoolLiquidity({ id: uid, pool, timestamp })
    await ctx.store.save(poolVol)
    return poolVol
  }
}
async function getDailyPoolVol(ctx: BlockHandlerContext, pool: Pool, timestamp: Date) {
  return await ctx.store.findOne<PoolVolumeDay>(PoolVolumeDay, { where: { pool: pool, timestamp: timestamp } })
}

export async function updatePoolLiquidity(
  ctx: EventHandlerContext | BlockHandlerContext,
  curr0: string,
  curr1: string,
  token0Liquidity: bigint,
  token1Liquidity: bigint
) {
  const pool = await getPool(ctx, curr0, curr1)
  const poolLiquidity = await getPoolLiquidity(ctx, pool)
  const date = startOfHour(new Date(ctx.block.timestamp))

  const curr = await getCurrency(ctx, curr0)

  poolLiquidity.token0Liquidity = BigInt(token0Liquidity)
  poolLiquidity.token1Liquidity = BigInt(token1Liquidity)
  poolLiquidity.timestamp = date
  poolLiquidity.usdTotalLiquidity = Number(await calcUsdVal(ctx, curr, token0Liquidity, date)) * Number(2)
  await ctx.store.save(poolLiquidity)
  return
}

function getOrderedPool(ccy0: string, ccy1: string) {
  switch (true) {
    case ccy0 == 'KAR' && ccy1 == 'KUSD':
      return [ccy0, ccy1]
    case ccy0 == 'KUSD' && ccy1 == 'KAR':
      return [ccy1, ccy0]
    case ccy0 == 'KUSD' && ccy1 != 'KAR':
      return [ccy0, ccy1]
    case ccy0 != 'KAR' && ccy1 == 'KUSD':
      return [ccy1, ccy0]
    default:
      return [ccy0, ccy1]
  }
}
