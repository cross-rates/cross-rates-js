import {expect, test} from "@jest/globals";
import {binanceApiClient} from "../../src/components/binanceApiClient";


test('can load data', async () => {
    await binanceApiClient.fetchCryptoCurrencies(
        c => expect(c).toBeDefined(), console.error
    )
});
