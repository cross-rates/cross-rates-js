import axios from "axios";

const baseUrl = "https://ntrocp887e.execute-api.eu-central-1.amazonaws.com/prod/monobank/currency";

export const monobankApiClient = {
    getRates(ratesConsumer, onError) {
        return axios.get(baseUrl)
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
