// SPDX-License-Identifier: BlueOak-1.0.0
pragma solidity 0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../../interfaces/IAsset.sol";
import "./OracleLib.sol";
import "./VersionedAsset.sol";

contract Asset is IAsset, VersionedAsset {
    using FixLib for uint192;
    using OracleLib for AggregatorV3Interface;

    uint192 public constant MAX_HIGH_PRICE_BUFFER = 2 * FIX_ONE; // {UoA/tok} 200%

    AggregatorV3Interface public immutable chainlinkFeed; // {UoA/tok}

    IERC20Metadata public immutable erc20;

    uint8 public immutable erc20Decimals;

    uint192 public immutable override maxTradeVolume; // {UoA}

    uint48 public immutable oracleTimeout; // {s}

    uint192 public immutable oracleError; // {1}

    // === Lot price ===

    uint48 public immutable priceTimeout; // {s} The period over which `savedHighPrice` decays to 0

    uint192 public savedLowPrice; // {UoA/tok} The low price of the token during the last update

    uint192 public savedHighPrice; // {UoA/tok} The high price of the token during the last update

    uint48 public lastSave; // {s} The timestamp when prices were last saved

    /// @param priceTimeout_ {s} The number of seconds over which savedHighPrice decays to 0
    /// @param chainlinkFeed_ Feed units: {UoA/tok}
    /// @param oracleError_ {1} The % the oracle feed can be off by
    /// @param maxTradeVolume_ {UoA} The max trade volume, in UoA
    /// @param oracleTimeout_ {s} The number of seconds until a oracle value becomes invalid
    /// @dev oracleTimeout_ is also used as the timeout value in price(), should be highest of
    ///      all assets' oracleTimeout in a collateral if there are multiple oracles
    constructor(
        uint48 priceTimeout_,
        AggregatorV3Interface chainlinkFeed_,
        uint192 oracleError_,
        IERC20Metadata erc20_,
        uint192 maxTradeVolume_,
        uint48 oracleTimeout_
    ) {
        require(priceTimeout_ > 0, "price timeout zero");
        require(address(chainlinkFeed_) != address(0), "missing chainlink feed");
        require(oracleError_ > 0 && oracleError_ < FIX_ONE, "oracle error out of range");
        require(address(erc20_) != address(0), "missing erc20");
        require(maxTradeVolume_ > 0, "invalid max trade volume");
        require(oracleTimeout_ > 0, "oracleTimeout zero");
        priceTimeout = priceTimeout_;
        chainlinkFeed = chainlinkFeed_;
        oracleError = oracleError_;
        erc20 = erc20_;
        erc20Decimals = erc20.decimals();
        maxTradeVolume = maxTradeVolume_;
        oracleTimeout = oracleTimeout_;
    }

    /// Can revert, used by other contract functions in order to catch errors
    /// Should not return FIX_MAX for low
    /// Should only return FIX_MAX for high if low is 0
    /// @dev The third (unused) variable is only here for compatibility with Collateral
    /// @return low {UoA/tok} The low price estimate
    /// @return high {UoA/tok} The high price estimate
    function tryPrice()
        external
        view
        virtual
        returns (
            uint192 low,
            uint192 high,
            uint192
        )
    {
        uint192 p = chainlinkFeed.price(oracleTimeout); // {UoA/tok}
        uint192 err = p.mul(oracleError, CEIL);
        // assert(low <= high); obviously true just by inspection
        return (p - err, p + err, 0);
    }

    /// Should not revert
    /// Refresh saved prices
    function refresh() public virtual override {
        try this.tryPrice() returns (uint192 low, uint192 high, uint192) {
            // {UoA/tok}, {UoA/tok}
            // (0, 0) is a valid price; (0, FIX_MAX) is unpriced

            // Save prices if priced
            if (high < FIX_MAX) {
                savedLowPrice = low;
                savedHighPrice = high;
                lastSave = uint48(block.timestamp);
            } else {
                // must be unpriced
                assert(low == 0);
            }
        } catch (bytes memory errData) {
            // see: docs/solidity-style.md#Catching-Empty-Data
            if (errData.length == 0) revert(); // solhint-disable-line reason-string
        }
    }

    /// Should not revert
    /// low should be nonzero if the asset could be worth selling
    /// @dev Should be general enough to not need to be overridden
    /// @return _low {UoA/tok} The lower end of the price estimate
    /// @return _high {UoA/tok} The upper end of the price estimate
    /// @notice If the price feed is broken, _low will decay downwards and _high will decay upwards
    ///     If tryPrice() is broken for more than `oracleTimeout + priceTimeout` seconds,
    ///     _low will be 0 and _high will be FIX_MAX.
    ///     Because the price decay begins at `oracleTimeout` seconds and not `updateTime` from the
    ///     price feed, the price feed can be broken for up to `2 * oracleTimeout` seconds without
    ///     affecting the price estimate.  This could happen if the Asset is refreshed just before
    ///     the oracleTimeout is reached, forcing a second period of oracleTimeout to pass before
    ///     the price begins to decay.
    function price() public view virtual returns (uint192 _low, uint192 _high) {
        try this.tryPrice() returns (uint192 low, uint192 high, uint192) {
            // if the price feed is still functioning, use that
            _low = low;
            _high = high;
        } catch (bytes memory errData) {
            // see: docs/solidity-style.md#Catching-Empty-Data
            if (errData.length == 0) revert(); // solhint-disable-line reason-string

            // if the price feed is broken, decay _low downwards and _high upwards

            uint48 delta = uint48(block.timestamp) - lastSave; // {s}
            if (delta <= oracleTimeout) {
                // use saved prices for at least the oracleTimeout
                _low = savedLowPrice;
                _high = savedHighPrice;
            } else if (delta >= oracleTimeout + priceTimeout) {
                // unpriced after a full timeout
                return (0, FIX_MAX);
            } else {
                // oracleTimeout <= delta <= oracleTimeout + priceTimeout

                // Decay _high upwards to 3x savedHighPrice
                // {UoA/tok} = {UoA/tok} * {1}
                _high = savedHighPrice.safeMul(
                    FIX_ONE + MAX_HIGH_PRICE_BUFFER.muluDivu(delta - oracleTimeout, priceTimeout),
                    ROUND
                ); // during overflow should not revert

                // if _high is FIX_MAX, leave at UNPRICED
                if (_high != FIX_MAX) {
                    // Decay _low downwards from savedLowPrice to 0
                    // {UoA/tok} = {UoA/tok} * {1}
                    _low = savedLowPrice.muluDivu(
                        oracleTimeout + priceTimeout - delta,
                        priceTimeout
                    );
                    // during overflow should revert since a FIX_MAX _low breaks everything
                }
            }
        }
        assert(_low <= _high);
    }

    /// @return {tok} The balance of the ERC20 in whole tokens
    function bal(address account) external view virtual returns (uint192) {
        return shiftl_toFix(erc20.balanceOf(account), -int8(erc20Decimals));
    }

    /// @return If the asset is an instance of ICollateral or not
    function isCollateral() external pure virtual returns (bool) {
        return false;
    }

    // solhint-disable no-empty-blocks

    /// Claim rewards earned by holding a balance of the ERC20 token
    /// DEPRECATED: claimRewards() will be removed from all assets and collateral plugins
    function claimRewards() external virtual {}

    // solhint-enable no-empty-blocks
}
