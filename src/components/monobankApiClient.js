import axios from "axios";

const baseUrl = "https://api.monobank.ua";

export const monobankApiClient = {
    getRates(ratesConsumer, onError) {
        axios.get(baseUrl + "/bank/currency")
            .then(response => {
                if (response
                    && (response.status === 200)
                    && response.data
                ) {
                    ratesConsumer(response.data)
                } else {
                    console.warn("Fetching latest rates failed", response);
                    throw response
                }
            })
            .catch(onError)
    }
}
