import { bn, fp } from '../../../../common/numbers'
import { networkConfig } from '../../../../common/configuration'

// TODO: double check these values
export const ORACLE_FEED = networkConfig['8453'].chainlinkFeeds.nARS!
export const ORACLE_TIMEOUT = bn('86400')
export const ORACLE_ERROR = fp('0.0025')

//  General
export const PRICE_TIMEOUT = bn(604800) // 1 week
export const DELAY_UNTIL_DEFAULT = bn(86400)

export const FORK_BLOCK = 19427483

export const NUM_HOLDER = '0x2CfC3C6B4D058C5B0f823C9fcD65198BFeDEAf85'
