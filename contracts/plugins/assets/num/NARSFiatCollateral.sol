// SPDX-License-Identifier: BlueOak-1.0.0
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../../../libraries/Fixed.sol";
import { FiatCollateral, CollateralConfig } from "../FiatCollateral.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../OracleLib.sol";

contract NARSCollateral is FiatCollateral {
    using FixLib for uint192;
    using OracleLib for AggregatorV3Interface;

    constructor(CollateralConfig memory config)
        FiatCollateral(config)
    {
        
    }
}
