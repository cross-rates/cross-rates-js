import {expect, test} from "@jest/globals";
import {binanceApiClient} from "../../src/components/binanceApiClient";


test('can load data 2', async () => {
    await binanceApiClient.fetchCryptoCurrencies(
        c => expect(c).toBeDefined(), console.error
    )
});
