import rates from "cross-rates";
import {expect, test} from "@jest/globals";

test('is not ready from start', () => {
    expect(rates.isReady()).toBe(false);
});

test('can load data from json', () => {
    expect(rates.getFiatCurrenciesData().UAH).toBeDefined();
});


