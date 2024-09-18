import { networkConfig } from '#/common/configuration'
import { bn, fp } from '#/common/numbers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { MockV3Aggregator } from '@typechain/MockV3Aggregator'
import { TestICollateral } from '@typechain/TestICollateral'
import { IERC20Metadata, MockV3Aggregator__factory } from '@typechain/index'
import { expect } from 'chai'
import { BigNumber, BigNumberish, ContractFactory } from 'ethers'
import { ethers } from 'hardhat'
import collateralTests from '../collateralTests'
import { getResetFork } from '../helpers'
import { CollateralOpts, CollateralFixtureContext } from '../pluginTestTypes'
import { pushOracleForward } from '../../../utils/oracles'
import { MAX_UINT192 } from '#/common/constants'
import {
  DELAY_UNTIL_DEFAULT,
  FORK_BLOCK,
  USDC_ORACLE_TIMEOUT,
  USDC_ORACLE_ERROR,
  PRICE_TIMEOUT,
  NUM_HOLDER,
} from './constants'
import { mintNARSTo } from './helpers'
import { whileImpersonating } from '#/test/utils/impersonation'
const { tokens, chainlinkFeeds } = networkConfig[8453]

interface MAFiatCollateralOpts extends CollateralOpts {
  defaultPrice?: BigNumberish
  defaultRefPerTok?: BigNumberish
}

const makeFiatCollateralTestSuite = (
  collateralName: string,
  defaultCollateralOpts: MAFiatCollateralOpts
) => {
  const deployCollateral = async (opts: MAFiatCollateralOpts = {}): Promise<TestICollateral> => {
    opts = { ...defaultCollateralOpts, ...opts }
    const NumCollateralFactory: ContractFactory = await ethers.getContractFactory('NARSCollateral')
    let collateral: TestICollateral
    try {
      collateral = <TestICollateral>await NumCollateralFactory.deploy({
        targetName: opts.targetName,
        priceTimeout: opts.priceTimeout,
        chainlinkFeed: opts.chainlinkFeed,
        oracleError: opts.oracleError,
        oracleTimeout: opts.oracleTimeout,
        maxTradeVolume: opts.maxTradeVolume,
        defaultThreshold: opts.defaultThreshold,
        delayUntilDefault: opts.delayUntilDefault,
        erc20: opts.erc20,
      })
      await collateral.deployed()
      // Push forward chainlink feed
      await pushOracleForward(opts.chainlinkFeed!)
      await expect(collateral.refresh())
      return collateral
    } catch (error) {
      console.log(`Error deploying collateral`, error)
      throw error
    }
  }

  type Fixture<T> = () => Promise<T>

  const makeCollateralFixtureContext = (
    alice: SignerWithAddress,
    inOpts: MAFiatCollateralOpts = {}
  ): Fixture<CollateralFixtureContext> => {
    const makeCollateralFixtureContext = async () => {
      const opts = { ...defaultCollateralOpts, ...inOpts }

      const MockV3AggregatorFactory = <MockV3Aggregator__factory>(
        await ethers.getContractFactory('MockV3Aggregator')
      )

      const chainlinkFeed = <MockV3Aggregator>(
        await MockV3AggregatorFactory.deploy(8, opts.defaultPrice!)
      )
      opts.chainlinkFeed = chainlinkFeed.address

      const collateral = await deployCollateral({ ...opts })
      const tok = await ethers.getContractAt('IERC20Metadata', await collateral.erc20())

      return {
        alice,
        collateral,
        chainlinkFeed,
        tok,
      } as CollateralFixtureContext
    }

    return makeCollateralFixtureContext
  }

  const reduceTargetPerRef = async (ctx: CollateralFixtureContext, pctDecrease: BigNumberish) => {
    const lastRound = await ctx.chainlinkFeed.latestRoundData()
    const nextAnswer = lastRound.answer.sub(lastRound.answer.mul(pctDecrease).div(100))
    await ctx.chainlinkFeed.updateAnswer(nextAnswer)
  }

  const increaseTargetPerRef = async (ctx: CollateralFixtureContext, pctIncrease: BigNumberish) => {
    const lastRound = await ctx.chainlinkFeed.latestRoundData()
    const nextAnswer = lastRound.answer.add(lastRound.answer.mul(pctIncrease).div(100))
    await ctx.chainlinkFeed.updateAnswer(nextAnswer)
  }

  // prettier-ignore
  const reduceRefPerTok = async (
  ctx: CollateralFixtureContext,
  pctDecrease: BigNumberish
) => {
  const nars = <IERC20Metadata>await ethers.getContractAt("IERC20Metadata", tokens.nARS!)
  const currentBal = await nars.balanceOf(ctx.tok.address)
  const removeBal = currentBal.mul(pctDecrease).div(100)
  await whileImpersonating(ctx.tok.address, async (signer) => {
    await nars.connect(signer).transfer(NUM_HOLDER, removeBal)
  })

  // push chainlink oracle forward so that tryPrice() still works and keeps peg
  const latestRoundData = await ctx.chainlinkFeed.latestRoundData()
  const nextAnswer = latestRoundData.answer.sub(latestRoundData.answer.mul(pctDecrease).div(100))
  await ctx.chainlinkFeed.updateAnswer(nextAnswer)
}

  const increaseRefPerTok = async (ctx: CollateralFixtureContext, pctIncrease: BigNumberish) => {
    const nars = <IERC20Metadata>await ethers.getContractAt('IERC20Metadata', tokens.nARS!)

    const currentBal = await nars.balanceOf(ctx.tok.address)
    const addBal = currentBal.mul(pctIncrease).div(100)
    await mintNARSTo(ctx, addBal, ctx.alice!, ctx.tok.address)

    // push chainlink oracle forward so that tryPrice() still works and keeps peg
    const latestRoundData = await ctx.chainlinkFeed.latestRoundData()
    const nextAnswer = latestRoundData.answer.add(latestRoundData.answer.mul(pctIncrease).div(100))
    await ctx.chainlinkFeed.updateAnswer(nextAnswer)
  }

  const getExpectedPrice = async (ctx: CollateralFixtureContext): Promise<BigNumber> => {
    const clData = await ctx.chainlinkFeed.latestRoundData()
    const clDecimals = await ctx.chainlinkFeed.decimals()

    const refPerTok = await ctx.collateral.refPerTok()
    return clData.answer
      .mul(bn(10).pow(18 - clDecimals))
      .mul(refPerTok)
      .div(fp('1'))
  }

  /*
    Define collateral-specific tests
  */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const collateralSpecificConstructorTests = () => {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const collateralSpecificStatusTests = () => {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const beforeEachRewardsTest = async () => {}

  const opts = {
    deployCollateral,
    collateralSpecificConstructorTests,
    collateralSpecificStatusTests,
    beforeEachRewardsTest,
    makeCollateralFixtureContext,
    mintCollateralTo: mintNARSTo,
    reduceTargetPerRef,
    increaseTargetPerRef,
    reduceRefPerTok,
    increaseRefPerTok,
    getExpectedPrice,
    itClaimsRewards: it.skip,
    itChecksTargetPerRefDefault: it,
    itChecksTargetPerRefDefaultUp: it,
    itChecksRefPerTokDefault: it,
    itChecksPriceChanges: it,
    itChecksNonZeroDefaultThreshold: it,
    itHasRevenueHiding: it,
    resetFork: getResetFork(FORK_BLOCK),
    collateralName,
    chainlinkDefaultAnswer: defaultCollateralOpts.defaultPrice!,
    itIsPricedByPeg: true,
    toleranceDivisor: bn('1e10'), // 1 part in 1 billion
    targetNetwork: 'base',
  }

  collateralTests(opts)
}

const makeOpts = (
  erc20: string,
  chainlinkFeed: string,
  oracleTimeout: BigNumber,
  oracleError: BigNumber
): MAFiatCollateralOpts => {
  return {
    targetName: ethers.utils.formatBytes32String('ARS'),
    priceTimeout: PRICE_TIMEOUT,
    oracleTimeout: oracleTimeout,
    oracleError: oracleError,
    defaultThreshold: oracleError.add(fp('0.01')),
    delayUntilDefault: DELAY_UNTIL_DEFAULT,
    maxTradeVolume: fp('1e6'),
    revenueHiding: fp('0'),
    defaultPrice: bn('1e8'),
    defaultRefPerTok: fp('1'),
    erc20: erc20,
    chainlinkFeed,
  }
}

/*
  Run the test suite
*/

makeFiatCollateralTestSuite(
  'NumFiatCollateral - nARS',
  makeOpts(tokens.nARS!, chainlinkFeeds.nARS!, USDC_ORACLE_TIMEOUT, USDC_ORACLE_ERROR)
)
