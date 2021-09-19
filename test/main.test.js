import rates from "cross-rates";
import {expect, test} from "@jest/globals";
import {monobankApiClient} from "../src/components/monobankApiClient";
import {binanceApiClient} from "../src/components/binanceApiClient";

test('correct checking on fiat currency codes', async () => {
    await monobankApiClient.getRates(_ => {
        expect(rates.getFiatCurrenciesData().UAH).toBeDefined();
        expect(rates.isFiat("BNB")).toBeFalsy();
        expect(rates.isFiat("UAH")).toBeTruthy();
        expect(rates.isFiat("BTC")).toBeFalsy();
        expect(rates.isFiat("USD")).toBeTruthy();
        expect(rates.getCurrencyInfo("UAH")).toBeDefined()
    }, e => {
        throw e
    })
});

test('should transform DAI to UAH correctly', async () => {
    await monobankApiClient.getRates(new Function(), new Function())
    await binanceApiClient.fetchCryptoCurrencies(new Function(), new Function())
    let result = rates.transform(950.54, "DAI", "UAH");
    expect(result).toBeDefined();
    expect(result).toBeGreaterThan(0);
    console.log("result", result)
});

