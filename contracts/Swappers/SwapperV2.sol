// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.0;
import "./SwapperV1.sol";
import "hardhat/console.sol";

contract SwapperV2 is SwapperV1 {
	address augustSwapper;

	function initializeSwap(
		uint256 _recipient,
		address _augustAddress,
		uint24 _poolFee
	) public {
		augustSwapper = _augustAddress;
		poolFee = _poolFee;
		recipient = payable(_recipient);
		__AccessControl_init();
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
	}

	function _smartSwap(bytes memory _data, uint256 _ethValue) internal {
		(bool success, bytes memory result) = augustSwapper.call{
			value: _ethValue
		}(_data);
		require(success, "Transaction fail!");
	}

	function smartSingleSwap(bytes memory _data) public payable correctEthValue {
		_smartSwap(_data, msg.value);
	}
}

/* struct SellData { */
/* address fromToken; */
/* uint256 fromAmount; */
/* uint256 toAmount; */
/* uint256 expectedAmount; */
/* address payable beneficiary; */
/* Utils.Path[] path; */
/* address payable partner; */
/* uint256 feePercent; */
/* bytes permit; */
/* uint256 deadline; */
/* bytes16 uuid; */
/* } */

/* function multiSwap( */
/* Utils.SellData calldata data */
/* ) */
/* external */
/* payable */
/* returns (uint256); */
