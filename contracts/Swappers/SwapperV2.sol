// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.0;
import "./SwapperV1.sol";
import "hardhat/console.sol";
import "../interfaces/IAugustSwapper.sol";
import "../interfaces/ITransferToken.sol";
pragma experimental ABIEncoderV2;

contract SwapperV2 is SwapperV1 {
	address public constant augustSwapper =
		0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57;

	/* @params _data encoded data provides for paraswao api */
	/* @params _ethValue quantity of eth */
	/* @notice make a complex swap with paraswap*/

	function _smartSwap(bytes memory _data, uint256 _ethValue) internal {
		(bool success, bytes memory result) = augustSwapper.call{
			value: _ethValue
		}(_data);
		if (!success) {
			// Next 5 lines from https://ethereum.stackexchange.com/a/83577
			if (result.length < 68) revert();
			assembly {
				result := add(result, 0x04)
			}
			revert(abi.decode(result, (string)));
		}
	}

	/* @params _data encoded data provides for paraswao api */
	/* @notice make a complex swap with paraswap only one token*/

	function smartSingleSwap(bytes memory _data) public payable correctEthValue {
		_smartSwap(_data, msg.value);
	}

	/* @params _data encoded data provides for paraswao api */
	/* @params _distribution array of percentage of each token */
	/* @notice make a complex swap with paraswap multiple  tokens*/

	function smartMultipleSwap(
		bytes[] memory _data,
		uint256[] calldata _distribution
	)
		public
		payable
		correctEthValue
		correctDistibution(_distribution, uint24(_data.length))
	{
		for (uint24 i = 0; i < _data.length; i++) {
			_smartSwap(_data[i], _calculateFee(msg.value, _distribution[i]));
		}
	}
}
