const { expect } = require("chai");
// const { fixture } = deployments;
const { printGas } = require("../utils/transactions");
const { getTransactionData } = require("../utils/paraswap");
const {
	DAI_ADDRESS,
	ETH_ADDRESS,
	balanceOf,
	ALBT_ADDRESS,
	// AUGUST,
	UNISWAP,
} = require("../utils/tokens");

const getTransactionMultipleData = async ({
	totalAmount,
	distribution,
	sender,
}) => {
	const transactionsHashes = distribution.map((distribution) => {
		return getTransactionData({
			fromToken: ETH_ADDRESS,
			toToken: ALBT_ADDRESS,
			amount: (totalAmount * distribution) / 100,
			fromDecimals: 18,
			toDecimals: 18,
			sender,
			deadline: Math.floor(Date.now / 1000) + 30 * 60 * 60,
		});
	});
	const txs = await Promise.all(transactionsHashes);
	const hashes = txs.map((tx) => tx?.data?.data);
	const amount = txs.map((tx) =>
		ethers.BigNumber.from(tx?.priceData?.srcAmount)
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
		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: [existingAddress],
		});

		feeRecipientSigner = await ethers.provider.getSigner(feeRecipient);
		transactionResponse = await getTransactionData({
			fromToken: ETH_ADDRESS,
			toToken: ALBT_ADDRESS,
			amount: ethers.utils.parseEther("1").toString(),
			fromDecimals: 18,
			toDecimals: 18,
			sender: existingAddress,
			deadline: Math.floor(Date.now / 1000) + 30 * 60 * 60,
		});
	});
	describe("smart swap", () => {
		it("swap", async () => {
			const preBalance = await balanceOf({
				tokenAddress: ALBT_ADDRESS,
				userAddress: existingAddress,
			});

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

			const postBalance = await balanceOf({
				tokenAddress: ALBT_ADDRESS,
				userAddress: existingAddress,
			});
			expect(postBalance).to.be.gt(preBalance);
		});
		it("multi swap", async () => {
			const totalAmount = ethers.utils.parseEther("1");
			const distribution = [50, 50];
			const txInfo = await getTransactionMultipleData({
				totalAmount,
				distribution,
				sender: existingAddress,
			});
			const preBalance = await balanceOf({
				tokenAddress: DAI_ADDRESS,
				userAddress: existingAddress,
			});

			const tx = await swapperV2.smartMultipleSwap(
				txInfo.hashes,
				txInfo.totalAmount,
				{
					value: totalAmount,
				}
			);
			await printGas(tx);

			const postBalance = await balanceOf({
				tokenAddress: ALBT_ADDRESS,
				userAddress: existingAddress,
			});
			expect(postBalance).to.be.gt(preBalance);
		});
	});
});
