const { expect } = require("chai");
// const { fixture } = deployments;
const { printGas } = require("../utils/transactions");
const { getTransactionData } = require("../utils/paraswap");
const {
	DAI_ADDRESS,
	ETH_ADDRESS,
	balanceOf,
	// ALBT_ADDRESS,
	// AUGUST,
	allowance,
	UNISWAP,
} = require("../utils/tokens");

const getTransactionMultipleData = async ({ totalAmount, distribution }) => {
	const transactionsHashes = distribution.map((distribution) => {
		return getTransactionData({
			fromToken: ETH_ADDRESS,
			toToken: DAI_ADDRESS,
			amount: (totalAmount * distribution) / 100,
			fromDecimals: 18,
			toDecimals: 18,
			sender: existingAddress,
			deadline: Math.floor(Date.now / 1000) + 30 * 60 * 60,
		});
	});
	const txs = await Promise.all(transactionsHashes);
	const hashes = txs.map((tx) => tx.data.data);
	let amount = ethers.BigNumber.from("0");
	txs.forEach(
		(tx) => (amount = amount.add(ethers.BigNumber.from(tx.priceData.srcAmount)))
	);

	return { hashes, totalAmount: amount };
};

describe("swapper v2", () => {
	beforeEach(async () => {
		({ deployer, user, feeRecipient } = await getNamedAccounts());
		const SwapperV2 = await ethers.getContractFactory("SwapperV2");
		const SwapperV1 = await ethers.getContractFactory("SwapperV1");

		swapperV1 = await upgrades.deployProxy(SwapperV1, [
			feeRecipient,
			UNISWAP,
			10,
		]);
		swapperV2 = await upgrades.upgradeProxy(swapperV1.address, SwapperV2);

		existingAddress = "0x7879a0c239f33db9160a8036db0e082616ca8690";
		feeRecipientSigner = await ethers.provider.getSigner(feeRecipient);
		transactionResponse = await getTransactionData({
			fromToken: ETH_ADDRESS,
			toToken: DAI_ADDRESS,
			amount: ethers.utils.parseEther("1").toString(),
			fromDecimals: 18,
			toDecimals: 18,
			sender: existingAddress,
			deadline: Math.floor(Date.now / 1000) + 30 * 60 * 60,
		});
	});
	describe("smart swap", () => {
		it("swap", async () => {
			const tx = await swapperV2.smartSingleSwap(
				transactionResponse.data.data,
				{
					value: ethers.utils.parseUnits(
						transactionResponse.priceData.srcAmount,
						"wei"
					),
				}
			);
			await printGas(tx);

			const balance = await balanceOf({
				tokenAddress: DAI_ADDRESS,
				userAddress: deployer,
			});
			expect(balance).to.be.gt(0);
		});
		it("multi swap", async () => {
			const totalAmount = ethers.utils.parseEther("1");
			const distribution = [50, 50];
			const txInfo = await getTransactionMultipleData({
				totalAmount,
				distribution,
			});

			const tx = await swapperV2.smartMultipleSwap(
				txInfo.hashes,
				distribution,
				{
					value: txInfo.totalAmount,
				}
			);
			await printGas(tx);

			const balance = await balanceOf({
				tokenAddress: DAI_ADDRESS,
				userAddress: deployer,
			});
			expect(balance).to.be.gt(0);
		});
	});
});
