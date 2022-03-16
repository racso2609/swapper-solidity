pragma solidity 0.7.0;

interface ITokenTransferProxy {
	function transferFrom(
		address token,
		address from,
		address to,
		uint256 amount
	) external;
}
