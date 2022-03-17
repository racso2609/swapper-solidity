const { expect } = require("chai");
// const { fixture } = deployments;
const { printGas, toWei } = require("../utils/transactions");
const { getTransactionData } = require("../utils/paraswap");
const { balanceOf, UNISWAP, getToken } = require("../utils/tokens");

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

		DAI_TOKEN = getToken("DAI");
		ETH_TOKEN = getToken("ETH");
		ALBT_TOKEN = getToken("ALBT");
		swapAmount = toWei(1);

		feeRecipientSigner = await ethers.provider.getSigner(feeRecipient);
	});
	describe("smart swap", () => {
		it("swap", async () => {
			const preBalance = await balanceOf({
				tokenAddress: DAI_TOKEN.address,
				userAddress: deployer,
			});
			const transactionResponse = await getTransactionData({
				fromToken: ETH_TOKEN,
				toToken: DAI_TOKEN,
				amount: swapAmount,
				contractAddress: swapperV2.address,
				userAddress: deployer,
				distribution: [100],
			});
			if (transactionResponse.error) throw new Error(transactionResponse.error);

			const tx = await swapperV2.smartSingleSwap(
				transactionResponse.data.data,
				DAI_TOKEN.address,
				{
					value: swapAmount,
				}
			);
			await printGas(tx);

			const postBalance = await balanceOf({
				tokenAddress: DAI_TOKEN.address,
				userAddress: deployer,
			});
			expect(postBalance).to.be.gt(preBalance);
		});
		it("multi swap", async () => {
			const totalAmount = 1;
			const distributions = [50, 50];
			const promises = distributions.map((distribution) => {
				return getTransactionData({
					fromToken: ETH_TOKEN,
					toToken: DAI_TOKEN,
					amount: toWei(Math.floor(totalAmount * distribution) / 100),
					contractAddress: swapperV2.address,
					userAddress: deployer,
				});
			});

			const txInfo = await Promise.all(promises);

			const hashes = txInfo.map((tx) => {
				if (tx.error) throw new Error(tx.error);
				return tx.data.data;
			});
			const preBalanceDAI = await balanceOf({
				tokenAddress: DAI_TOKEN.address,
				userAddress: deployer,
			});

			const preBalanceALBT = await balanceOf({
				tokenAddress: ALBT_TOKEN.address,
				userAddress: deployer,
			});
			//
			const tx = await swapperV2.smartMultipleSwap(
				hashes,
				[DAI_TOKEN.address, ALBT_TOKEN.address],
				distributions,
				{
					value: toWei(2),
				}
			);
			await printGas(tx);
			const postBalanceDAI = await balanceOf({
				tokenAddress: DAI_TOKEN.address,
				userAddress: deployer,
			});
			const postBalanceALBT = await balanceOf({
				tokenAddress: ALBT_TOKEN.address,
				userAddress: deployer,
			});
			expect(postBalanceDAI).to.be.gt(preBalanceDAI);
			expect(postBalanceALBT).to.be.gt(preBalanceALBT);
		});
	});
});
