import rates from "cross-rates-browser";
import {expect} from "@jest/globals";

class LocalStorageMock {
    constructor() {
        this.store = {};
    }

    clear() {
        this.store = {};
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        this.store[key] = value.toString();
    }

    removeItem(key) {
        delete this.store[key];
    }
}

Object.defineProperty(window, 'localStorage', {value: new LocalStorageMock()});

test('is not ready from start', () => {
    console.log(rates);
    expect(rates.isReady()).toBe(false);
});

test('can load data from json', () => {
    console.log(rates.getFiatCurrenciesData());
    expect(rates.getFiatCurrenciesData().UAH).toBeDefined();
});
