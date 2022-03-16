const { expect } = require("chai");
const { fixture } = deployments;
const { printGas, impersonate } = require("../utils/transactions");
const { getTransactionData } = require("../utils/paraswap");
const {
	DAI_ADDRESS,
	ETH_ADDRESS,
	balanceOf,
	ALBT_ADDRESS,
} = require("../utils/tokens");
const UNISWAP = process.env.UNISWAP;

describe("swapper v2", () => {
	beforeEach(async () => {
		({ deployer, user, feeRecipient } = await getNamedAccounts());
		await fixture(["V2"]);
		swapperV2 = await ethers.getContract("SwapperV2");
		existingAddress = "0x7879a0c239f33db9160a8036db0e082616ca8690";
		feeRecipientSigner = await ethers.provider.getSigner(feeRecipient);
		data = await getTransactionData({
			fromToken: ETH_ADDRESS,
			toToken: DAI_ADDRESS,
			amount: ethers.utils.parseEther("100").toString(),
			fromDecimals: 18,
			toDecimals: 18,
			sender: existingAddress,
			deadline: Math.floor(Date.now / 1000) + 30 * 60 * 60,
		});
	});
	describe("smart swap", () => {
		it("swap", async () => {
			console.log(data);
			const tx = await swapperV2.smartSingleSwap(data.data, {
				value: ethers.utils.parseEther("100"),
			});
			await printGas(tx);
			const balance = await balanceOf({
				tokenAddress: DAI_ADDRESS,
				userAddress: deployer,
			});
			expect(balance).to.be.gt(0);
		});
	});
});
