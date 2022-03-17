const axios = require("axios");
const slippage = 5;
// https://apiv5.paraswap.io/prices/?srcToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&destToken=0x6b175474e89094c44da98b954eedeac495271d0f&amount=10000000000000000000&srcDecimals=18&destDecimals=18&side=SELL&network=1

async function getPriceData({ fromToken, toToken, amount, contractAddress }) {
	try {
		const response = await axios.get(`https://apiv5.paraswap.io/prices`, {
			params: {
				srcToken: fromToken.address,
				destToken: toToken.address,
				srcDecimals: fromToken.decimals,
				destDecimals: toToken.decimals,
				amount: amount,
				network: process.env.NETWORKID,
				userAddress: contractAddress,
				partner: "paraswap",
			},
		});
		return { data: response?.data?.priceRoute };
	} catch (err) {
		return { error: err?.response?.data?.error || err.message };
	}
}

async function getTransactionData({
	fromToken,
	toToken,
	amount,
	contractAddress,
	userAddress,
}) {
	try {
		const url = `https://apiv5.paraswap.io/transactions/${process.env.NETWORKID}`;
		let priceData = await getPriceData({
			fromToken,
			toToken,
			amount,
			contractAddress,
		});
		if (!priceData.data) throw new Error(priceData.error);
		priceData = priceData.data;
		const data = {
			srcToken: fromToken.address,
			destToken: toToken.address,
			srcDecimals: fromToken.decimals,
			destDecimals: toToken.decimals,
			priceRoute: priceData,
			receiver: contractAddress,
			userAddress: contractAddress,
			txOrigin: userAddress,
			partner: "paraswap",
			slippage: slippage * 100,
			deadline: Math.floor(Date.now() / 1000) + 600,
			srcAmount: amount,
		};
		const response = await axios.post(url, data, {
			headers: { "Content-Type": "application/json" },
			params: {
				onlyParams: false,
				ignoreChecks: true,
				ignoreGasEstimate: true,
			},
		});
		return { data: response.data, priceData: priceData };
	} catch (err) {
		return { error: err?.response?.data?.error || err.message };
	}
}

module.exports = { getPriceData, getTransactionData };
