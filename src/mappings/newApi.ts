import { ApiPromise, WsProvider } from '@polkadot/api'
import { ApiDecoration, ApiOptions } from '@polkadot/api/types'
import {options} from '@acala-network/api'
import { Hash } from '@polkadot/types/interfaces'
import config from './config'

export class SubstrateApi {
  private _api?: ApiPromise
  private _lastHash?: Hash | Uint8Array | string
  private _cachedApiAt?: ApiDecoration<'promise'>

  public async init(options: ApiOptions) {
    await this.connect(options)
    return this
  }

  private async connect(options: ApiOptions) {
    this._api = await ApiPromise.create(options)
    this._api.on('error', async (e) => {
      console.log(`Api error: ${JSON.stringify(e)}, reconnecting....`)
      await this.connect(options)
    })
  }

  public async getPoolDepths(
    hash: Hash | Uint8Array | string,
    ccy0: { Token: string },
    ccy1: { Token: string }
  ): Promise<[bigint, bigint]> {
    const apiAt = await this.apiAt(hash)
    const [resp1, resp2]: [bigint, bigint] = (await apiAt.query.dex.liquidityPool([ccy0, ccy1])) as any

    return [resp1, resp2]
  }

  private async apiAt(hash: Hash | Uint8Array | string): Promise<ApiDecoration<'promise'>> {
    if (!this._api) throw new Error('Api not initialized')

    if (this._lastHash !== hash || !this._cachedApiAt) {
      this._cachedApiAt = await this._api.at(hash)
    }

    return this._cachedApiAt
  }
}

let api: SubstrateApi

export async function getApi() {
  if (!api) {
    const provider = new WsProvider(process.env.KAR_WSS)
    api = await new SubstrateApi().init({
      provider: provider,
    })
  }

  return api
}
