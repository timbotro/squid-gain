import { CurrencyId, CurrencyId_Token } from '../types/v2022'
import primitivesConfig from '@acala-network/type-definitions/primitives'
import { EventHandlerContext } from '@subsquid/substrate-processor'
import { DexSwapEvent } from '../types/events'
import { Currency, LiquidityChangeReason, Swap } from '../model/generated'
import { addLiquidityChange, getCurrency, updateGlobalLiquidities, updateGlobalVolumes } from './utility'
import { updatePoolLiquidity, updatePoolVolume } from './liquidityPools'

interface SwapParams {
  trader: Uint8Array
  propPath: CurrencyId[]
  liquidityChanges: bigint[]
}

async function getSwapParams(ctx: EventHandlerContext): Promise<SwapParams> {
  const event = new DexSwapEvent(ctx)
  if (event.isV1008) {
    const [trader, path, liquidityChanges] = event.asV1008
    const propPath = path as CurrencyId[]
    return { trader, propPath, liquidityChanges }
  }
  if (event.isV1009) {
    const [trader, path, liquidityChanges] = event.asV1009
    const propPath = path as CurrencyId[]
    return { trader, propPath, liquidityChanges }
  }
  if (event.isV1019) {
    const [trader, path, liquidityChanges] = event.asV1019
    const propPath = path as CurrencyId[]
    return { trader, propPath, liquidityChanges }
  }
  if (event.isV2001) {
    const [trader, path, liquidityChanges] = event.asV2001
    const propPath = path as CurrencyId[]
    return { trader, propPath, liquidityChanges }
  }
  if (event.isV2010) {
    const [trader, path, liquidityChanges] = event.asV2010
    const propPath = path as CurrencyId[]
    return { trader, propPath, liquidityChanges }
  }
  if (event.isV2011) {
    const [trader, path, liquidityChanges] = event.asV2011
    const propPath = path as CurrencyId[]
    return { trader, propPath, liquidityChanges }
  }
  if (event.isV2012) {
    const { trader, path, liquidityChanges } = event.asV2012
    const propPath = path as CurrencyId[]
    return { trader, propPath, liquidityChanges }
  }
  if (event.isV2022) {
    const { trader, path, liquidityChanges } = event.asV2022
    const propPath = path as CurrencyId[]
    return { trader, propPath, liquidityChanges }
  }

  const { trader, path, liquidityChanges } = event.asV2041
  const propPath = path as CurrencyId[]
  return { trader, propPath, liquidityChanges }
}

export async function handleSwap(ctx: EventHandlerContext): Promise<void> {
  const { store, event, block } = ctx
  let { trader, propPath, liquidityChanges } = await getSwapParams(ctx)
  let timestamp = BigInt(block.timestamp)
  for (let i = 1; i < propPath.length; i++) {
    let fromCurrency = propPath[i - 1]
    let toCurrency = propPath[i]
    if (fromCurrency.__kind !== 'Token' || toCurrency.__kind !== 'Token') continue
    let fromAmount = BigInt(liquidityChanges[i - 1])
    let toAmount = BigInt(liquidityChanges[i])

    const curr0 = await getCurrency(ctx, fromCurrency.value.__kind)
    const curr1 = await getCurrency(ctx, toCurrency.value.__kind)

    await store.save(
      new Swap({
        id: event.id + '-' + i,
        timestamp,
        fromCurrency: curr0,
        toCurrency: curr1,
        fromAmount,
        toAmount,
      })
    )

    let [currency0, currency1] = getTradingPair(fromCurrency, toCurrency)
    let b0 = currency0 === fromCurrency ? fromAmount : -toAmount
    let b1 = currency1 === fromCurrency ? fromAmount : -toAmount

    await addLiquidityChange(ctx, LiquidityChangeReason.SWAP, currency0, currency1, b0, b1, i)
    await updateGlobalVolumes(ctx,curr0,fromAmount)
    await updateGlobalVolumes(ctx,curr1,toAmount)
    await updatePoolVolume(ctx, curr0, curr1, fromAmount)

   
  }
}

function getTradingPair(
  currencyA: CurrencyId_Token,
  currencyB: CurrencyId_Token
): [CurrencyId_Token, CurrencyId_Token] {
  let order: Record<string, number> = primitivesConfig.types.TokenSymbol._enum
  return [currencyA, currencyB].sort((a, b) => {
    return order[a.value.__kind] - order[b.value.__kind]
  }) as [CurrencyId_Token, CurrencyId_Token]
}
