import currenciesIso from "./resources/currencies-iso-4217.json";
import currencyCodes from "./resources/currencies-iso-4217-code.json";
import {monobankApiClient} from "./components/monobankApiClient";
import {binanceApiClient} from "./components/binanceApiClient";
import {InMemoryRepository} from "./components/InMemoryRepository";

const uahNumCode = 980;
const BTC = "BTC";
const EUR = "EUR";
const USDT = "USDT";


const currencies = {
    getByStringCode(code) {
        return currenciesIso[code]
    },
    getByNumCode(code) {
        const currencyCodeLength = 3;
        const strCode = "" + code;
        let addZeros = currencyCodeLength - strCode.length;

        while (addZeros > 0) {
            code = "0" + code;
            --addZeros
        }
        let res = currencyCodes[code];
        if (!res) {
            console.warn("can't find currency data for code", code)
        }
        return res
    },
};
const cryptoCurrencyTypeName = "crypto";
const fiatCurrencyTypeName = "fiat";

function compareStrings(a, b) {
    return (a < b) ? -1 : (a > b ? 1 : 0)
}

class Rates {

    constructor(storageFactory) {
        this.typeToTransformer = {
            [fiatCurrencyTypeName + fiatCurrencyTypeName]: this.transformFiatToFiat,
            [fiatCurrencyTypeName + cryptoCurrencyTypeName]: this.transformFiatToCrypto,
            [cryptoCurrencyTypeName + fiatCurrencyTypeName]: this.transformCryptoToFiat,
            [cryptoCurrencyTypeName + cryptoCurrencyTypeName]: this.transformCryptoToCrypto,
        };
        this.fiatRatesRepository = storageFactory().name('fiat-rates').nullObject([]).build();
        this.cryptoRatesRepository = storageFactory().name('crypto-rates').nullObject([]).build();
        this.cryptoCurrenciesRepository = storageFactory().name('crypto-currencies').nullObject([]).build();
        this.refreshRates();
    }


    getCryptoPrice(left, right) {
        const cryptoRates = this.cryptoRatesRepository.getLatest();
        let ticker = cryptoRates.filter(r => r.symbol === `${left}${right}`)[0] || {};
        let price = +(ticker.price);

        if (price && !isNaN(price)) {
            return price;
        }
        ticker = cryptoRates.filter(r => r.symbol === `${right}${left}`)[0] || {};
        price = +(ticker.price);

        if (price && !isNaN(price)) {
            return 1 / price;
        }
        const ticker1 = cryptoRates.filter(r => r.symbol === `${left}${USDT}`)[0] || {};
        const price1 = +(ticker1.price);
        const ticker2 = cryptoRates.filter(r => r.symbol === `${right}${USDT}`)[0] || {};
        const price2 = +(ticker2.price);
        price = price1 / price2;

        if (price && !isNaN(price)) {
            return price;
        }
    }

    transformCrypto(amountFrom, currencyFrom, currencyTo) {
        let price = this.getCryptoPrice(currencyFrom, currencyTo);
        if (price) {
            return amountFrom * price;
        }
        price = this.getCryptoPrice(currencyTo, currencyFrom);
        if (price) {
            return amountFrom / price;
        }
    }

    transformFiatToFiat(amount, currency, resultCurrency) {
        const outputCurrencyNumCode = +(currencies.getByStringCode(resultCurrency).numCode);
        const currencyNumCode = +(currencies.getByStringCode(currency).numCode);

        if (currencyNumCode === outputCurrencyNumCode) {
            return amount
        }
        const transformCurrencyToUAH = (amount, currencyNumCode) => {
            if (currencyNumCode === uahNumCode) {
                return amount;
            }
            const rateCross = this.findFiatRate(currencyNumCode, uahNumCode);
            return amount * rateCross;
        }
        const amountInUah = transformCurrencyToUAH(amount, currencyNumCode);

        if (outputCurrencyNumCode === uahNumCode) {
            return amountInUah
        }
        const rateCross = this.findFiatRate(outputCurrencyNumCode, uahNumCode);
        return amountInUah / rateCross;
    }

    transformCryptoToCrypto(amount, currency, resultCurrency) {
        if (currency === resultCurrency) {
            return amount
        }
        let resultAmount = this.transformCrypto(amount, currency, resultCurrency);
        if (resultAmount) {
            return resultAmount
        }
        let btcAmount = this.transformCrypto(amount, currency, BTC);
        return this.transformCrypto(btcAmount, BTC, resultCurrency);
    }

    transformCryptoToFiat(amount, currency, resultCurrency) {
        const btcAmount = (currency === BTC)
            ? amount
            : this.transformCrypto(amount, currency, BTC);

        const btcEurPrice = this.getCryptoPrice(BTC, EUR);
        const amountInEur = btcAmount * btcEurPrice;

        if (currency === BTC && resultCurrency === EUR) {
            return amountInEur;
        }

        return this.transformFiatToFiat(amountInEur, EUR, resultCurrency);
    }

    transformFiatToCrypto(fiatAssetAmount, currency, resultCurrency) {
        if (currency === resultCurrency) {
            return fiatAssetAmount
        }
        const eurAmount = (currency === EUR)
            ? fiatAssetAmount
            : this.transformFiatToFiat(fiatAssetAmount, currency, EUR);

        const btcEurPrice = this.getCryptoPrice(BTC, EUR);
        const btcAmount = eurAmount / btcEurPrice;

        if (resultCurrency === BTC) {
            return btcAmount
        }
        let amount = this.transformCrypto(btcAmount, BTC, resultCurrency);
        if (amount) {
            return amount;
        }
        return 0;
    }

    getFiatCurrenciesData() {
        return currenciesIso;
    }

    findFiatRate(left, right) {
        const rate = this.fiatRatesRepository.getLatest().filter(r => (r.currencyCodeA === left)
            && (r.currencyCodeB === right))[0];

        return rate.rateCross || ((rate.rateBuy + rate.rateSell) / 2);
    }

    isFiat(currencyStrCode) {
        return !!this.getFiatCurrencies().indexOf(currencyStrCode.toUpperCase()) >= 0;
    }

    getCurrencyType(currency) {
        return this.isFiat(currency) ? fiatCurrencyTypeName : cryptoCurrencyTypeName
    }

    transform(amount, currency, resultCurrency) {
        if (!this.isReady()) {
            throw new Error("Rates are not ready yet, check by calling 'isReady()' function")
        }
        const pairType = this.getCurrencyType(currency) + this.getCurrencyType(resultCurrency);
        return this.typeToTransformer[pairType](amount, currency, resultCurrency)
    }

    isReady() {
        return !!this.fiatRatesRepository.getLatest().length
            && !!this.cryptoRatesRepository.getLatest().length
    }

    triggerOnChange(callMe) {
        this.fiatRatesRepository.subscribeOnChange(() => callMe());
        this.cryptoCurrenciesRepository.subscribeOnChange(() => callMe());
    }

    onFiatRatesUpdate(consumer) {
        this.fiatRatesRepository.subscribeOnChange(consumer);
    }

    onCryptoRatesUpdate(consumer) {
        this.cryptoCurrenciesRepository.subscribeOnChange(consumer);
    }

    getCryptoCurrencies() {
        return this.cryptoCurrenciesRepository.getLatest()
            .sort()
            .map(currencyStrCode => ({
                crypto: true,
                code: currencyStrCode,
                afterDecimalPoint: 8,
                name: currencyStrCode,
            }))
    }

    getFiatCurrencies() {
        return Object
            .values(this.fiatRatesRepository.getLatest().reduce((result, rate) => {
                const currencyA = currencies.getByNumCode(rate.currencyCodeA);
                result[currencyA.code] = currencyA;
                const currencyB = currencies.getByNumCode(rate.currencyCodeB);
                result[currencyB.code] = currencyB;
                return result
            }, {}))
            .sort((a, b) => compareStrings(a.code, b.code))
    }

    refreshRates() {
        let savedRates = null;
        let savedCryptoRates = null;

        const fetchLatestFiatRates = () => {
            monobankApiClient.getRates(
                fiatRates => {
                    if (fiatRates
                        && !fiatRates.errorDescription
                        && fiatRates.length
                    ) {
                        if (fiatRates !== savedRates) {
                            this.fiatRatesRepository.save(fiatRates);
                            savedRates = fiatRates;
                        }
                    } else {
                        throw fiatRates
                    }
                },
                console.error
            );
        };
        const fetchCryptoCurrencies = () => {
            binanceApiClient.fetchCryptoCurrencies(
                response => {
                    let symbols = response.data.symbols;
                    if (symbols) {
                        this.cryptoCurrenciesRepository.save(Object.keys(symbols
                            .sort((a, b) => compareStrings(a.symbol, b.symbol))
                            .reduce((result, symbol) => {
                                result[symbol.baseAsset] = true;
                                result[symbol.quoteAsset] = true;
                                return result
                            }, {})));
                    } else {
                        throw response
                    }
                },
                console.error
            )
        };
        const fetchLatestCryptoCurrenciesRates = () => {
            binanceApiClient.fetchLatestCryptoCurrenciesRates(
                response => {
                    let cryptoRates = response.data;
                    if (!cryptoRates) {
                        throw response
                    }
                    if (cryptoRates !== savedCryptoRates) {
                        this.cryptoRatesRepository.save(cryptoRates);
                        savedCryptoRates = cryptoRates;
                    }
                },
                console.error
            );
        };
        fetchLatestFiatRates();
        fetchCryptoCurrencies();
        fetchLatestCryptoCurrenciesRates();
    }
}

const rates = new Rates(() => InMemoryRepository.builder());
export default rates;

export function ratesWithStorage(storageSupplier) {
    return new Rates(storageSupplier)
}
