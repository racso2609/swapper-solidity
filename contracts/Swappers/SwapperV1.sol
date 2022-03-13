// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity =0.7.0;
/* pragma abicoder v2; */

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
/* import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol"; */

/* import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol"; */
import "hardhat/console.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

contract SwapperV1 is Initializable {
	using SafeMath for uint256;

	IUniswapV2Router02 public uniSwapRouter;
	// For this example, we will set the pool fee to 0.1%.
	uint24 public poolFee;
	address public constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

	uint256 constant deadline = 2 minutes;
	address payable recipient;

	function initialize(
		address _recipient,
		address _uniSwapRouter,
		uint24 _poolFee
	) external initializer {
		uniSwapRouter = IUniswapV2Router02(_uniSwapRouter);
		poolFee = _poolFee;
		recipient = payable(_recipient);
	}

	function _getAmountsOut(address[] memory _tokens, uint256 _amount)
		internal
		view
		returns (uint256)
	{
		return uniSwapRouter.getAmountsOut(_amount, _tokens)[1];
	}

	function swap(address _tokenOut) public payable {
		require(msg.value > 0, "Must pass non 0 ETH amount");

		address[] memory path = new address[](2);
		path[0] = uniSwapRouter.WETH();
		path[1] = _tokenOut;

		uint256 tokensAmount = _getAmountsOut(path, msg.value);

		uniSwapRouter.swapExactETHForTokens{
			value: msg.value.sub(msg.value.div(poolFee))
		}(
			tokensAmount.sub(tokensAmount.div(poolFee)),
			path,
			msg.sender,
			block.timestamp + deadline
		);

		recipient.transfer(msg.value.div(poolFee));
	}
}
