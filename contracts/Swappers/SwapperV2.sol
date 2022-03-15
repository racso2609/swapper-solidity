// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.0;
import "./SwapperV1.sol";

contract SwapperV2 is SwapperV1 {
	function _smartSwap(address _tokenOut, uint256 _ethValue) internal {}

	function smartSingleSwap(address _tokenOut) public payable correctEthValue {}
}
