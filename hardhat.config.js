/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-deploy-ethers");
require("@openzeppelin/hardhat-upgrades");
require("chai");

let mnemonic = process.env.MNEMONIC
	? process.env.MNEMONIC
	: "test test test test test test test test test test test test";

module.exports = {
	networks: {
		hardhat: {
			forking: {
				url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
				accounts: {
					mnemonic,
				},
			},
		},
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API,
	},
	namedAccounts: {
		deployer: 0,
		feeRecipient: 1,
		user: 2,
		userNotRegister: 3,
	},
	gasReporter: {
		currency: "USD",
		gasPrice: 50,
		enabled: process.env.REPORT_GAS ? true : false,
		coinmarketcap: process.env.CMC_API_KEY,
		excludeContracts: ["mocks/"],
	},
	solidity: {
		compilers: [
			{
				version: "0.8.7",
			},
			{
				version: "0.7.0",
				settings: {},
			},
			{
				version: "0.7.5",
				settings: {},
			},
		],
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	mocha: {
		timeout: 240000,
	},
};
