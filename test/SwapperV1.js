const { expect } = require("chai");
const { fixture } = deployments;
const { printGas } = require("../utils/transactions");
const { DAI_ADDRESS, balanceOf, ALBT_ADDRESS } = require("../utils/tokens");
const UNISWAP = process.env.UNISWAP;

describe("Swapper v1", () => {
	beforeEach(async () => {
		({ deployer, user, feeRecipient } = await getNamedAccounts());
		await fixture(["V1"]);
		swapperV1 = await ethers.getContract("SwapperV1");
		feeRecipientSigner = await ethers.provider.getSigner(feeRecipient);
	});

	describe("basic config", () => {
		it("address of uniswap uniSwapRouter v2", async () => {
			const uniSwapRouterAddress = await swapperV1.uniSwapRouter();
			expect(uniSwapRouterAddress).to.be.eq(UNISWAP);
		});
	});
	describe("swap eth for tokens", async () => {
		it("swap ether for dai faail", async () => {
			await expect(swapperV1.singleSwap(DAI_ADDRESS)).to.be.revertedWith(
				"You must pass 100 eth at least!"
			);
		});

		it("swap ether for dai", async () => {
			const recipientPreBalance = await feeRecipientSigner.provider.getBalance(
				feeRecipient
			);
			const tx = await swapperV1.singleSwap(DAI_ADDRESS, {
				value: ethers.utils.parseEther("1"),
			});
			await printGas(tx);
			const balance = await balanceOf({
				tokenAddress: DAI_ADDRESS,
				userAddress: deployer,
			});

			const recipientPostBalance = await feeRecipientSigner.provider.getBalance(
				feeRecipient
			);

			expect(balance).to.be.gt(0);
			expect(recipientPostBalance).to.be.gt(recipientPreBalance);
		});
	});
	describe("multi swap", () => {
		it("fail especify distribution to each token", async () => {
			await expect(
				swapperV1.multiSwap([DAI_ADDRESS, ALBT_ADDRESS], [50])
			).to.be.revertedWith("Please supply the distribution to each coin!");
		});
		it("fail distribution is not 100%", async () => {
			await expect(
				swapperV1.multiSwap([DAI_ADDRESS, ALBT_ADDRESS], [50, 10])
			).to.be.revertedWith("Incorrect distribution!");
		});

		it("fail no enought eth", async () => {
			await expect(
				swapperV1.multiSwap([DAI_ADDRESS, ALBT_ADDRESS], [50, 50])
			).to.be.revertedWith("You must pass 100 eth at least!");
		});

		it("multi swap", async () => {
			const tx = await swapperV1.multiSwap(
				[DAI_ADDRESS, ALBT_ADDRESS],
				[50, 50],
				{ value: ethers.utils.parseEther("1") }
			);
			await printGas(tx);

			const ALBBalance = await balanceOf({
				tokenAddress: ALBT_ADDRESS,
				userAddress: deployer,
			});

			const DAIBalance = await balanceOf({
				tokenAddress: DAI_ADDRESS,
				userAddress: deployer,
			});
			expect(ALBBalance).to.be.gt(0);
			expect(DAIBalance).to.be.gt(0);
		});
	});
});
