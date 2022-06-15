import chains from '../static/chains'

export type ChainInfo = typeof chains[number]
export type ChainName = typeof chains[number]['name']

export type Threshold = 'SuperMajorityApprove' | 'SuperMajorityAgainst' | 'SimpleMajority'
