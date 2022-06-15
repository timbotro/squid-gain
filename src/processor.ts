import * as handlers from './mappings'
import { lookupArchive } from '@subsquid/archive-registry'
import { SubstrateProcessor } from '@subsquid/substrate-processor'
import { setPriority } from 'os'
import { handleDailyStats, handlePoolData } from './mappings/liquidityPools'
require('dotenv/config')

const processor = new SubstrateProcessor('karura_swap')

processor.setBatchSize(500)
processor.setDataSource({
  archive: lookupArchive('karura')[0].url,
  chain: process.env.KAR_WSS as string,
})
processor.setTypesBundle('karura')
processor.setBlockRange({ from: 2000000 })
processor.addPreHook(handlePoolData)
processor.addPreHook(handleDailyStats)
processor.addEventHandler('dex.Swap', handlers.handleSwap)
processor.addEventHandler('dex.AddLiquidity', handlers.handleAddLiquidity)
processor.addEventHandler('dex.RemoveLiquidity', handlers.handleRemoveLiquidity)

processor.run()


