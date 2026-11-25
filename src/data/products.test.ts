import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import products from "./products.json";

describe("preços dos temas enviados", () => {
  for (const id of ["JPM_66", "JPM_73", "JPM_74", "JPM_75"]) {
    it(`${id} começa em R$ 170,00`, () => {
      assert.equal(products.find((product) => product.id === id)?.price, 170);
    });
  }
});

describe("temas novos de R$ 170,00", () => {
  const novos: Array<[string, string]> = [
    ["JPM_76", "Homem Aranha HQ"],
    ["JPM_77", "Ursinho Baby Azul"],
    ["JPM_78", "Fundo do Mar"],
    ["JPM_79", "50 Anos Azul e Dourado"],
    ["JPM_80", "Moranguinho Clássica"],
    ["JPM_81", "Confraternização Natalina"],
    ["JPM_82", "Adulto Rosa Choque e Dourado"],
    ["JPM_83", "São Paulo FC"],
    ["JPM_84", "Batizado Anjinho Verde e Dourado"],
    ["JPM_85", "Cowboy Baby Nude"],
  ];

  for (const [id, title] of novos) {
    it(`${id} ${title} começa em R$ 170,00`, () => {
      const product = products.find((item) => item.id === id);
      assert.equal(product?.title, title);
      assert.equal(product?.price, 170);
      assert.ok(product?.image.startsWith("/__l5e/assets-v1/"));
    });
  }
});
