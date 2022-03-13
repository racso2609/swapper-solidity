// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.0;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

/* import "hardhat/console.sol"; */
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract SwapperV1 is Initializable, AccessControlUpgradeable {
	using SafeMath for uint256;

	IUniswapV2Router02 public uniSwapRouter;
	uint24 public poolFee;
	address public constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

	uint256 constant deadline = 2 minutes;
	address payable public recipient;
	modifier correctDistibution(
		uint256[] memory _distribution,
		uint24 _tokensLength
	) {
		require(
			_distribution.length == _tokensLength,
			"Please supply the distribution to each coin!"
		);
		uint256 aux;
		for (uint24 i = 0; i < _distribution.length; i++) {
			aux += _distribution[i];
		}
		require(aux == 100, "Incorrect distribution!");
		_;
	}
	modifier correctEthValue() {
		require(msg.value > 100, "You must pass 100 eth at least!");
		_;
	}
	modifier onlyRole(bytes32 _role) {
		require(hasRole(_role, msg.sender), "You are not an admin!");
		_;
	}

	function initialize(
		address _recipient,
		address _uniSwapRouter,
		uint24 _poolFee
	) external initializer {
		uniSwapRouter = IUniswapV2Router02(_uniSwapRouter);
		poolFee = _poolFee;
		recipient = payable(_recipient);
		__AccessControl_init();
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
	}

	function _getAmountsOut(address[] memory _tokens, uint256 _amount)
		internal
		view
		returns (uint256)
	{
		return uniSwapRouter.getAmountsOut(_amount, _tokens)[1];
	}

	function _calculateFee(uint256 _amount, uint256 _porcentage)
		internal
		returns (uint256)
	{
		return _amount.mul(_porcentage).div(100);
	}

	function _swap(address _tokenOut, uint256 _ethValue) internal {
		address[] memory path = new address[](2);
		path[0] = uniSwapRouter.WETH();
		path[1] = _tokenOut;

		uint256 tokensAmount = _getAmountsOut(path, _ethValue);

		uniSwapRouter.swapExactETHForTokens{ value: _ethValue }(
			tokensAmount,
			path,
			msg.sender,
			block.timestamp + deadline
		);
	}

	function singleSwap(address _tokenOut) public payable correctEthValue {
		uint256 amountMinusFee = msg.value.sub(_calculateFee(msg.value, poolFee));

		_swap(_tokenOut, amountMinusFee);

		recipient.transfer(_calculateFee(msg.value, poolFee));
	}

	function multiSwap(
		address[] memory _tokensOut,
		uint256[] memory _distribution
	)
		external
		payable
		correctDistibution(_distribution, uint24(_tokensOut.length))
		correctEthValue
	{
		for (uint24 i = 0; i < _tokensOut.length; i++) {
			_swap(_tokensOut[i], _calculateFee(msg.value, _distribution[i]));
		}
	}

	function setRecipient(address _recipient)
		external
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		recipient = payable(_recipient);
	}
}
