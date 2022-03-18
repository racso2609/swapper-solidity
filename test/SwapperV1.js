const { expect } = require("chai");
const { fixture } = deployments;
const { printGas, toWei } = require("../utils/transactions");
const { balanceOf, AUGUST, UNISWAP, getToken } = require("../utils/tokens");

describe("Swapper v1", () => {
	beforeEach(async () => {
		({ deployer, user, feeRecipient } = await getNamedAccounts());

		await fixture(["V1"]);
		feeRecipientSigner = await ethers.provider.getSigner(feeRecipient);
		swapperV1 = await ethers.getContract("SwapperV1");
		WBTC_TOKEN = getToken("WBTC");
		WETH_TOKEN = getToken("WETH");
	});

	describe("basic config", () => {
		it("address of uniswap uniSwapRouter v2", async () => {
			const uniSwapRouterAddress = await swapperV1.uniSwapRouter();
			expect(uniSwapRouterAddress).to.be.eq(UNISWAP);
		});
		it("change recipient fail not admin", async () => {
			await expect(
				swapperV1.connect(feeRecipientSigner).setRecipient(user)
			).to.be.revertedWith("You are not an admin!");
		});
		it("change recipient ", async () => {
			const tx = await swapperV1.setRecipient(user);
			await printGas(tx);

			const newRecipient = await swapperV1.recipient();
			expect(newRecipient).to.be.eq(user);
		});
	});
	describe("swap eth for tokens", async () => {
		it("swap ether for dai faail", async () => {
			await expect(swapperV1.singleSwap(WBTC_TOKEN.address)).to.be.revertedWith(
				"You must pass 100 eth at least!"
			);
		});

		it("swap ether for dai", async () => {
			const recipientPreBalance = await feeRecipientSigner.provider.getBalance(
				feeRecipient
			);

			const tx = await swapperV1.singleSwap(WBTC_TOKEN.address, {
				value: ethers.utils.parseEther("1"),
			});
			await printGas(tx);

			const recipientPostBalance = await feeRecipientSigner.provider.getBalance(
				feeRecipient
			);
			const balance = await balanceOf({
				tokenAddress: WBTC_TOKEN.address,
				userAddress: deployer,
			});

			expect(balance).to.be.gt(0);
			expect(recipientPostBalance).to.be.gt(recipientPreBalance);
		});
		it("swap event", async () => {
			const value = ethers.utils.parseEther("1");

			await expect(
				swapperV1.singleSwap(WBTC_TOKEN.address, {
					value,
				})
			)
				.to.emit(swapperV1, "Swap")
				.withArgs(deployer, ethers.BigNumber.from("900000000000000000"));
		});
	});
	describe("multi swap", () => {
		it("fail especify distribution to each token", async () => {
			await expect(
				swapperV1.multiSwap([WBTC_TOKEN.address, WETH_TOKEN.address], [50])
			).to.be.revertedWith("Please supply the distribution to each coin!");
		});
		it("fail distribution is not 100%", async () => {
			await expect(
				swapperV1.multiSwap([WBTC_TOKEN.address, WETH_TOKEN.address], [50, 10])
			).to.be.revertedWith("Incorrect distribution!");
		});

		it("fail no enought eth", async () => {
			await expect(
				swapperV1.multiSwap([WBTC_TOKEN.address, WETH_TOKEN.address], [50, 50])
			).to.be.revertedWith("You must pass 100 eth at least!");
		});

		it("multi swap", async () => {
			const tx = await swapperV1.multiSwap(
				[WBTC_TOKEN.address, WETH_TOKEN.address],
				[50, 50],
				{ value: ethers.utils.parseEther("1") }
			);
			await printGas(tx);

			const WETHBalance = await balanceOf({
				tokenAddress: WETH_TOKEN.address,
				userAddress: deployer,
			});

			const WBTCBalance = await balanceOf({
				tokenAddress: WBTC_TOKEN.address,
				userAddress: deployer,
			});
			expect(WETHBalance).to.be.gt(0);
			expect(WBTCBalance).to.be.gt(0);
		});
	});
	describe("upgrade", () => {
		beforeEach(async () => {
			const SwapperV2 = await ethers.getContractFactory("SwapperV2");
			const SwapperV1 = await ethers.getContractFactory("SwapperV1");

			swapperV1 = await upgrades.deployProxy(SwapperV1, [
				feeRecipient,
				UNISWAP,
				10,
			]);
			swapperV2 = await upgrades.upgradeProxy(swapperV1.address, SwapperV2);
		});
		it("august", async () => {
			console.log();
			expect(await swapperV2.augustSwapper()).to.be.eq(AUGUST);
		});
	});
});
