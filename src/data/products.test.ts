import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import products from "./products.json";

describe("preços dos temas enviados", () => {
  for (const id of ["JPM_66", "JPM_73", "JPM_74"]) {
    it(`${id} começa em R$ 170,00`, () => {
      assert.equal(products.find((product) => product.id === id)?.price, 170);
    });
  }
});