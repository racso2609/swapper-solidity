const axios = require("axios");
// https://apiv5.paraswap.io/prices/?srcToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&destToken=0x6b175474e89094c44da98b954eedeac495271d0f&amount=10000000000000000000&srcDecimals=18&destDecimals=18&side=SELL&network=1

async function getPriceData({
	fromToken,
	toToken,
	amount,
	fromDecimals,
	toDecimals,
}) {
	try {
		const url = `https://apiv5.paraswap.io/prices/?srcToken=${fromToken}&destToken=${toToken}&amount=${amount}&srcDecimals=${fromDecimals}&destDecimals=${toDecimals}&side=SELL&network=1`;
		const response = await axios.get(url);
		return { data: response?.data?.priceRoute };
	} catch (err) {
		return { error: err?.response?.data?.error || err.message };
	}
}

async function getTransactionData({
	fromToken,
	toToken,
	amount,
	fromDecimals,
	toDecimals,
	sender,
}) {
	try {
		const url = "https://apiv5.paraswap.io/transactions/1";
		let priceData = await getPriceData({
			fromToken,
			toToken,
			amount,
			fromDecimals,
			toDecimals,
		});
		priceData = priceData.data;
		if (!priceData) throw new Error("No data");

		const data = {
			srcToken: fromToken,
			destToken: toToken,
			srcAmount: amount,
			destAmount: priceData.destAmount,
			priceRoute: priceData,
			userAddress: sender,
			partner: "paraswap.io",
			srcDecimals: priceData.srcDecimals,
			destDecimals: priceData.destDecimals,
		};
		console.log(data);
		const response = await axios.post(url, data);
		return { data: response.data };
	} catch (err) {
		return { error: err?.response?.data?.error || err.message };
	}
}

// (async () => {
// console.log(
// await getTransactionData({
// fromToken: ETH_ADDRESS,
// toToken: DAI_ADDRESS,
// amount: 10000000000,
// fromDecimals: 18,
// toDecimals: 18,
// sender: "0x5a46AB557E9F579A02Cc4C40e51990e6aC7164e1",
// })
// );
// })();

module.exports = { getPriceData, getTransactionData };
