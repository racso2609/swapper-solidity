const CONTRACT_NAME = "SwapperV2";

// modify when needed
module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy } = deployments;
	const { deployer, feeRecipient } = await getNamedAccounts();

	await deploy(CONTRACT_NAME, {
		from: deployer,
		log: true,
	});
};

module.exports.tags = [CONTRACT_NAME, "Swapper", "V2"];
