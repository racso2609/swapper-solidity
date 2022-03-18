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

		WBTC_TOKEN = getToken("WBTC");
		MATIC_TOKEN = getToken("MATIC");
		WETH_TOKEN = getToken("WETH");
		swapAmount = toWei(1);

		feeRecipientSigner = await ethers.provider.getSigner(feeRecipient);
	});
	describe("smart swap", () => {
		it("swap", async () => {
			const preBalance = await balanceOf({
				tokenAddress: WBTC_TOKEN.address,
				userAddress: deployer,
			});
			const transactionResponse = await getTransactionData({
				fromToken: MATIC_TOKEN,
				toToken: WBTC_TOKEN,
				amount: swapAmount,
				contractAddress: swapperV2.address,
				userAddress: deployer,
				distribution: [100],
			});
			if (transactionResponse.error) throw new Error(transactionResponse.error);

			const tx = await swapperV2.smartSingleSwap(
				transactionResponse.data.data,
				WBTC_TOKEN.address,
				{
					value: swapAmount,
				}
			);
			await printGas(tx);

			const postBalance = await balanceOf({
				tokenAddress: WBTC_TOKEN.address,
				userAddress: deployer,
			});
			expect(postBalance).to.be.gt(preBalance);
		});
		it("multi swap", async () => {
			const totalAmount = 1;
			const distributions = [50, 50];
			const tokens = [WBTC_TOKEN, WETH_TOKEN];
			const promises = distributions.map((distribution, index) => {
				return getTransactionData({
					fromToken: MATIC_TOKEN,
					toToken: tokens[index],
					amount: toWei(
						Math.floor(totalAmount * distribution) / 100
					).toString(),
					contractAddress: swapperV2.address,
					userAddress: deployer,
				});
			});

			const txInfo = await Promise.all(promises);

			const hashes = txInfo.map((tx) => {
				if (tx.error) throw new Error(tx.error);
				return tx.data.data;
			});

			const preBalanceWBTC = await balanceOf({
				tokenAddress: WBTC_TOKEN.address,
				userAddress: deployer,
			});

			const preBalanceWETH = await balanceOf({
				tokenAddress: WETH_TOKEN.address,
				userAddress: deployer,
			});
			const tx = await swapperV2.smartMultipleSwap(
				hashes,
				tokens.map((token) => token.address),
				distributions,
				{
					value: ethers.utils.parseEther("1"),
				}
			);
			await printGas(tx);
			const postBalanceWBTC = await balanceOf({
				tokenAddress: WBTC_TOKEN.address,
				userAddress: deployer,
			});
			const postBalanceWETH = await balanceOf({
				tokenAddress: WETH_TOKEN.address,
				userAddress: deployer,
			});
			expect(postBalanceWBTC).to.be.gt(preBalanceWBTC);
			expect(postBalanceWETH).to.be.gt(preBalanceWETH);
		});
	});
});
