import rates from "cross-rates";
import {expect, test} from "@jest/globals";
import {monobankApiClient} from "../src/components/monobankApiClient";

test('correct checking on fiat currency codes', async () => {
    await monobankApiClient.getRates(_ => {
        expect(rates.getFiatCurrenciesData().UAH).toBeDefined();
        expect(rates.isFiat("BNB")).toBeFalsy();
        expect(rates.isFiat("UAH")).toBeTruthy();
        expect(rates.isFiat("BTC")).toBeFalsy();
        expect(rates.isFiat("USD")).toBeTruthy();
    }, e => {
        throw e
    })
});

