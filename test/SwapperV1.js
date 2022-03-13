const { expect } = require("chai");
const { fixture } = deployments;
const { printGas } = require("../utils/transactions");
const {
	DAI_ADDRESS,
	balanceOf,
	impersonateTokens,
} = require("../utils/tokens");
const UNISWAP = process.env.UNISWAP;
// const { UNISWAP_ABI } = require("../utils/uniswap");
// const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

describe("Swapper v1", () => {
	beforeEach(async () => {
		({ deployer, user, feeRecipient } = await getNamedAccounts());
		await fixture(["V1"]);
		swapperV1 = await ethers.getContract("SwapperV1");
		feeRecipientSigner = await ethers.provider.getSigner(feeRecipient);
		// uniswap = new ethers.Contract(
		// UNISWAP,
		// UNISWAP_ABI,
		// feeRecipientSigner.provider
		// );
	});

	describe("basic config", () => {
		it("address of uniswap uniSwapRouter v2", async () => {
			const uniSwapRouterAddress = await swapperV1.uniSwapRouter();
			expect(uniSwapRouterAddress).to.be.eq(UNISWAP);
		});
	});
	describe("swap eth for tokens", async () => {
		beforeEach(async () => {
			// impersonate WETH9
			await impersonateTokens({
				fundAddress: deployer,
				impersonateAddress: "0x2feb1512183545f48f6b9c5b4ebfcaf49cfca6f3",
				tokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
				amount: ethers.utils.parseEther("1"),
			});
		});
		it("swap ether for dai faail", async () => {
			await expect(swapperV1.swap(DAI_ADDRESS)).to.be.revertedWith(
				"Must pass non 0 ETH amount"
			);
		});

		it("swap ether for dai", async () => {
			const tx = await swapperV1.swap(DAI_ADDRESS, {
				value: ethers.utils.parseEther("1"),
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
