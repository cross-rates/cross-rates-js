import {expect, test} from "@jest/globals";
import {monobankApiClient} from "../../src/components/monobankApiClient";


test('can load monobank rates', async () => {
    await monobankApiClient.getRates(
        c => expect(c).toBeDefined(), console.error
    )
});
