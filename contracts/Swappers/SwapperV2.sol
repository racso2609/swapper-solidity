// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.0;
import "./SwapperV1.sol";
import "hardhat/console.sol";
import "../interfaces/IAugustSwapper.sol";
import "../interfaces/ITransferToken.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
pragma experimental ABIEncoderV2;

contract SwapperV2 is SwapperV1 {
	using SafeERC20Upgradeable for IERC20Upgradeable;
	address public constant augustSwapper =
		0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57;

	/* @params _data encoded data provides for paraswao api */
	/* @params _ethValue quantity of eth */
	/* @notice make a complex swap with paraswap and take fee*/

	function _smartSwap(
		bytes calldata _data,
		IERC20Upgradeable _token,
		uint256 _value
	) internal {
		(bool success, bytes memory result) = augustSwapper.call{ value: _value }(
			_data
		);

		if (!success) {
			// Next 5 lines from https://ethereum.stackexchange.com/a/83577
			if (result.length < 68) revert();
			assembly {
				result := add(result, 0x04)
			}
			revert(abi.decode(result, (string)));
		}
		uint256 swapAmount = abi.decode(result, (uint256));
		console.log("result: ", swapAmount);
		require(swapAmount > 0, "Fail Swap!");

		uint256 fee = _calculateFee(swapAmount, poolFee);

		if (fee > 0) {
			_token.safeTransfer(recipient, fee);
		}
		_token.safeTransfer(msg.sender, swapAmount - fee);
	}

	/* @params _data encoded data provides for paraswao api */
	/* @notice make a complex swap with paraswap only one token*/

	function smartSingleSwap(bytes calldata _data, IERC20Upgradeable _token)
		public
		payable
		correctEthValue
	{
		_smartSwap(_data, _token, msg.value);
	}

	/* @params _data encoded data provides for paraswao api */
	/* @params _distribution array of percentage of each token */
	/* @notice make a complex swap with paraswap multiple  tokens*/

	function smartMultipleSwap(
		bytes[] calldata _data,
		IERC20Upgradeable[] calldata _tokens,
		uint256[] calldata _distributions
	) public payable correctEthValue {
		for (uint24 i = 0; i < _data.length; i++) {
			console.log(_calculateFee(msg.value, _distributions[i]));
			_smartSwap(
				_data[i],
				_tokens[i],
				_calculateFee(msg.value, _distributions[i])
			);
		}
	}
}
