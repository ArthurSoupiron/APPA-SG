import { describe, expect, test } from "bun:test";

import { parseMissionInfosTxt } from "./parse-mission-infos-txt";

const SAMPLE = `[CLIENT]
nom: Dupont
prenom: Jean
telephone: 06 12 34 56 78
mail: jean.dupont@example.com

[ENTREPRISE]
nom: Acme SARL
siren: 123456789
mail: contact@acme.fr
telephone: 01 23 45 67 89
adresse: 10 rue Example
ville: Paris
code_postal: 75001
pays: France
`;

describe("parseMissionInfosTxt", () => {
  test("parse nominal complet", () => {
    const result = parseMissionInfosTxt(SAMPLE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.client).toEqual({
      nomClient: "Dupont",
      prenomClient: "Jean",
      telephoneClient: "06 12 34 56 78",
      mailClient: "jean.dupont@example.com",
    });
    expect(result.data.entreprise).toEqual({
      nomEntreprise: "Acme SARL",
      sirenEntreprise: "123456789",
      mailEntreprise: "contact@acme.fr",
      telephoneEntreprise: "01 23 45 67 89",
      adresseEntreprise: "10 rue Example",
      villeEntreprise: "Paris",
      codePostalEntreprise: "75001",
      paysEntreprise: "France",
    });
  });

  test("accepte les alias FR", () => {
    const text = `[CLIENT]
Nom: Martin
Prénom: Claire

[ENTREPRISE]
Nom entreprise: Beta SAS
Code postal: 69001
`;
    const result = parseMissionInfosTxt(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.client.nomClient).toBe("Martin");
    expect(result.data.client.prenomClient).toBe("Claire");
    expect(result.data.entreprise.nomEntreprise).toBe("Beta SAS");
    expect(result.data.entreprise.codePostalEntreprise).toBe("69001");
    expect(result.data.entreprise.paysEntreprise).toBe("France");
  });

  test("ignore commentaires et lignes vides", () => {
    const text = `# Fiche mission
[CLIENT]
nom: Durand

# contact
mail: a@b.fr

[ENTREPRISE]
nom: Gamma
`;
    const result = parseMissionInfosTxt(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.client.mailClient).toBe("a@b.fr");
  });

  test("échoue si nom client absent", () => {
    const result = parseMissionInfosTxt(`[CLIENT]\nmail: x@y.fr\n\n[ENTREPRISE]\nnom: Acme`);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Nom client");
  });

  test("échoue si nom entreprise absent", () => {
    const result = parseMissionInfosTxt(`[CLIENT]\nnom: Dupont\n\n[ENTREPRISE]\nsiren: 123`);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Nom entreprise");
  });

  test("avertit sur clé inconnue", () => {
    const text = `[CLIENT]
nom: Dupont
foo: bar

[ENTREPRISE]
nom: Acme
`;
    const result = parseMissionInfosTxt(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings.some((w) => w.includes("foo"))).toBe(true);
  });
});
