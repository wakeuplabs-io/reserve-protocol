// SPDX-License-Identifier: BlueOak-1.0.0
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library AllowanceLib {
    /// An approve helper that:
    ///   1. Sets initial allowance to 0
    ///   2. Tries to set the provided allowance
    ///   3. Falls back to setting a maximum allowance, if (2) fails
    /// Context: Some new-age ERC20s think it's a good idea to revert for allowances
    /// that are > 0 but < type(uint256).max.
    function safeApproveFallbackToMax(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        // 1. Set initial allowance to 0
        token.approve(spender, 0);
        require(token.allowance(address(this), spender) == 0, "allowance not 0");

        if (value == 0) return;

        // 2. Try to set the provided allowance
        bool success; // bool success = false;
        try token.approve(spender, value) returns (bool) {
            success = token.allowance(address(this), spender) == value;
        } catch {}

        // 3. Fall-back to setting a maximum allowance
        if (!success) {
            token.approve(spender, type(uint256).max);
            require(
                token.allowance(address(this), spender) == type(uint256).max,
                "allowance not max"
            );
        }
    }
}
