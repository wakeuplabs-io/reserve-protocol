import { ITokens, networkConfig } from '#/common/configuration'

const tokens: { [key: string]: string } = {
  [networkConfig['1'].tokens.USDC!.toLowerCase()]: 'USDC',
  [networkConfig['1'].tokens.USDT!.toLowerCase()]: 'USDT',
  [networkConfig['1'].tokens.USDP!.toLowerCase()]: 'USDP',
  [networkConfig['1'].tokens.TUSD!.toLowerCase()]: 'TUSD',
  [networkConfig['1'].tokens.BUSD!.toLowerCase()]: 'BUSD',
  [networkConfig['1'].tokens.FRAX!.toLowerCase()]: 'FRAX',
  [networkConfig['1'].tokens.MIM!.toLowerCase()]: 'MIM',
  [networkConfig['1'].tokens.eUSD!.toLowerCase()]: 'eUSD',
  [networkConfig['1'].tokens.aDAI!.toLowerCase()]: 'aDAI',
  [networkConfig['1'].tokens.aUSDC!.toLowerCase()]: 'aUSDC',
  [networkConfig['1'].tokens.aUSDT!.toLowerCase()]: 'aUSDT',
  [networkConfig['1'].tokens.aBUSD!.toLowerCase()]: 'aBUSD',
  [networkConfig['1'].tokens.aUSDP!.toLowerCase()]: 'aUSDP',
  [networkConfig['1'].tokens.aWETH!.toLowerCase()]: 'aWETH',
  [networkConfig['1'].tokens.cDAI!.toLowerCase()]: 'cDAI',
  [networkConfig['1'].tokens.cUSDC!.toLowerCase()]: 'cUSDC',
  [networkConfig['1'].tokens.cUSDT!.toLowerCase()]: 'cUSDT',
  [networkConfig['1'].tokens.cUSDP!.toLowerCase()]: 'cUSDP',
  [networkConfig['1'].tokens.cETH!.toLowerCase()]: 'cETH',
  [networkConfig['1'].tokens.cWBTC!.toLowerCase()]: 'cWBTC',
  [networkConfig['1'].tokens.fUSDC!.toLowerCase()]: 'fUSDC',
  [networkConfig['1'].tokens.fUSDT!.toLowerCase()]: 'fUSDT',
  [networkConfig['1'].tokens.fFRAX!.toLowerCase()]: 'fFRAX',
  [networkConfig['1'].tokens.fDAI!.toLowerCase()]: 'fDAI',
  [networkConfig['1'].tokens.AAVE!.toLowerCase()]: 'AAVE',
  [networkConfig['1'].tokens.stkAAVE!.toLowerCase()]: 'stkAAVE',
  [networkConfig['1'].tokens.COMP!.toLowerCase()]: 'COMP',
  [networkConfig['1'].tokens.WETH!.toLowerCase()]: 'WETH',
  [networkConfig['1'].tokens.WBTC!.toLowerCase()]: 'WBTC',
  [networkConfig['1'].tokens.EURT!.toLowerCase()]: 'EURT',
  [networkConfig['1'].tokens.RSR!.toLowerCase()]: 'RSR',
  [networkConfig['1'].tokens.CRV!.toLowerCase()]: 'CRV',
  [networkConfig['1'].tokens.CVX!.toLowerCase()]: 'CVX',
  [networkConfig['1'].tokens.ankrETH!.toLowerCase()]: 'ankrETH',
  [networkConfig['1'].tokens.frxETH!.toLowerCase()]: 'frxETH',
  [networkConfig['1'].tokens.sfrxETH!.toLowerCase()]: 'sfrxETH',
  [networkConfig['1'].tokens.stETH!.toLowerCase()]: 'stETH',
  [networkConfig['1'].tokens.wstETH!.toLowerCase()]: 'wstETH',
  [networkConfig['1'].tokens.rETH!.toLowerCase()]: 'rETH',
  [networkConfig['1'].tokens.cUSDCv3!.toLowerCase()]: 'cUSDCv3',
  [networkConfig['1'].tokens.DAI!.toLowerCase()]: 'DAI',
  ['0x60C384e226b120d93f3e0F4C502957b2B9C32B15'.toLowerCase()]: 'saUSDC',
  ['0x21fe646D1Ed0733336F2D4d9b2FE67790a6099D9'.toLowerCase()]: 'saUSDT',
  ['0xf201fFeA8447AB3d43c98Da3349e0749813C9009'.toLowerCase()]: 'cUSDCVault', //  TODO: Replace with real address
  ['0x840748F7Fd3EA956E5f4c88001da5CC1ABCBc038'.toLowerCase()]: 'cUSDTVault', //  TODO: Replace with real address
}

export const logToken = (tokenAddress: string) => {
  return tokens[tokenAddress.toLowerCase()]
    ? tokens[tokenAddress.toLowerCase()]
    : tokenAddress.toLowerCase()
}
