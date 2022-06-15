import { ProcessorConfig } from './processorConfig'

export default {
    chainName: 'karura',
    prefix: 'karura',
    dataSource: {
        archive: 'https://karura.indexer.gc.subsquid.io/v4/graphql',
        chain: process.env.KAR_WSS,
    },
    typesBundle: 'karura',
    batchSize: 500,
    blockRange: {
        from: 0,
    },
} as ProcessorConfig
