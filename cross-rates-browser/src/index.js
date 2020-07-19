import {ratesWithStorage} from "cross-rates";
import {LocalStorageRepository} from "./components/LocalStorageRepository";

export const rates = ratesWithStorage(() => LocalStorageRepository.builder());

rates.refreshRates();

