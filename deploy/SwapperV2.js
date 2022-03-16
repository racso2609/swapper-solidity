const CONTRACT_NAME = "SwapperV2";
const AUGUST = process.env.AUGUST;
// polFee is porcentage * 10**2
const POOLFEE = 10;

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
					methodName: "initializeSwap",
					args: [feeRecipient, AUGUST, POOLFEE],
				},
			},
		},
	});
};

module.exports.tags = [CONTRACT_NAME, "Swapper", "V2"];
