import axios from "axios";

const binanceApiUrl = "https://api.binance.com";

function extractResponse(onSuccess) {
    return response => {
        if (response && (response.status === 200)) {
            onSuccess(response)
        } else {
            throw response
        }
    };
}

export const binanceApiClient = {
    fetchCryptoCurrencies(onSuccess, onError) {
        return axios.get(binanceApiUrl + "/api/v3/exchangeInfo")
            .then(extractResponse(onSuccess))
            .catch(onError)
    },
    fetchLatestCryptoCurrenciesRates(onSuccess, onError) {
        return axios.get(binanceApiUrl + "/api/v1/ticker/price")
            .then(extractResponse(onSuccess))
            .catch(onError)
    }
};
