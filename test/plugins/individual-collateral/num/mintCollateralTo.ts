import { IERC20Metadata } from '../../../../typechain'
import { whileImpersonating } from '../../../utils/impersonation'
import { BigNumberish } from 'ethers'
import { FORK_BLOCK, NUM_HOLDER } from './constants'
import { getResetFork } from '../helpers'
import { CollateralFixtureContext, MintCollateralFunc } from '../pluginTestTypes'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const mintNuars = async (sFrax: IERC20Metadata, amount: BigNumberish, recipient: string) => {
  await whileImpersonating(NUM_HOLDER, async (whale) => {
    await sFrax.connect(whale).transfer(recipient, amount)
  })
}

export const mintCollateralTo: MintCollateralFunc<CollateralFixtureContext> = async (
  ctx: CollateralFixtureContext,
  amount: BigNumberish,
  user: SignerWithAddress,
  recipient: string
) => {
  await mintNuars(ctx.tok, amount, recipient)
}

export const resetFork = getResetFork(FORK_BLOCK)
