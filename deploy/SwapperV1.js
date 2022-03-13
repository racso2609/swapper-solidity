const CONTRACT_NAME = "SwapperV1";

// modify when needed
module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy } = deployments;
	const { deployer, feeRecipient } = await getNamedAccounts();

	await deploy(CONTRACT_NAME, {
		from: deployer,
		log: true,
		proxy: {
			execute: {
				init: {
					methodName: "initialize",
					args: [feeRecipient],
				},
			},
		},
	});
};

module.exports.tags = [CONTRACT_NAME, "Swapper", "V1"];
