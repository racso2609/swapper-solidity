const CONTRACT_NAME = "Uniswap";

// modify when needed
module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	const swapperV1 = await deployments.get("SwapperV1");

	await deploy(CONTRACT_NAME, {
		from: deployer,
		log: true,
		// proxy: {
		// execute: {
		// init: {
		// methodName: "initialize",
		// args: [swapperV1.address],
		// },
		// },
		// },
	});
};

module.exports.tags = [CONTRACT_NAME, "Swapper", "V1", "V2"];
module.exports.dependencies = ["SwapperV1"];
