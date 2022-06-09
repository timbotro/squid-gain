import {options} from '@acala-network/api'
import {ApiPromise} from '@polkadot/api'
import {WsProvider} from '@polkadot/rpc-provider'
require('dotenv/config')

const provider = new WsProvider(process.env.KAR_WSS)
const api = new ApiPromise(options({provider}))
api.isReady.catch(() => {})

export async function acala(): Promise<ApiPromise> {
    await api.isReady
    return api
}
