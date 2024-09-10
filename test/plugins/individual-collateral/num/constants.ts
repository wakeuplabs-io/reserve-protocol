import { bn, fp } from '../../../../common/numbers'
import { networkConfig } from '../../../../common/configuration'

// Base Addresses

// USDC
export const USDC_USD_FEED = networkConfig['8453'].chainlinkFeeds.USDC!
export const USDC_ORACLE_TIMEOUT = bn('86400')
export const USDC_ORACLE_ERROR = fp('0.0025')

// PYUSD
export const PYUSD_USD_FEED = networkConfig['8453'].chainlinkFeeds.pyUSD!
export const PYUSD_ORACLE_TIMEOUT = bn('86400')
export const PYUSD_ORACLE_ERROR = fp('0.003')

// USDT
export const USDT_USD_FEED = networkConfig['8453'].chainlinkFeeds.USDT!
export const USDT_ORACLE_TIMEOUT = bn('86400')
export const USDT_ORACLE_ERROR = fp('0.0025')

// ETH
export const ETH_USD_FEED = networkConfig['8453'].chainlinkFeeds.ETH!
export const ETH_ORACLE_TIMEOUT = bn('3600')
export const ETH_ORACLE_ERROR = fp('0.005')

//  General
export const PRICE_TIMEOUT = bn(604800) // 1 week
export const DELAY_UNTIL_DEFAULT = bn(86400)

export const FORK_BLOCK = 19423387

export const NUM_HOLDER = '0x2CfC3C6B4D058C5B0f823C9fcD65198BFeDEAf85'
