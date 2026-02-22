import { describe, expect, it } from "vitest";
import {
  sanitizeInput,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validatePrice,
  validateRequired,
} from "@/lib/validation";

describe("validateEmail", () => {
  it("rejette un email vide", () => {
    expect(validateEmail("")).not.toBeNull();
    expect(validateEmail("  ")).not.toBeNull();
  });

  it("rejette un email invalide", () => {
    expect(validateEmail("not-an-email")).not.toBeNull();
    expect(validateEmail("foo@")).not.toBeNull();
    expect(validateEmail("@bar.com")).not.toBeNull();
  });

  it("accepte un email valide", () => {
    expect(validateEmail("test@example.com")).toBeNull();
    expect(validateEmail("user.name@domain.fr")).toBeNull();
  });
});

describe("validatePassword", () => {
  it("rejette un mot de passe vide", () => {
    expect(validatePassword("")).not.toBeNull();
  });

  it("rejette un mot de passe trop court", () => {
    expect(validatePassword("abc")).not.toBeNull();
    expect(validatePassword("12345")).not.toBeNull();
  });

  it("accepte un mot de passe de 6+ caractères", () => {
    expect(validatePassword("123456")).toBeNull();
    expect(validatePassword("strongpassword")).toBeNull();
  });
});

describe("validatePasswordMatch", () => {
  it("rejette des mots de passe différents", () => {
    expect(validatePasswordMatch("abc123", "abc124")).not.toBeNull();
  });

  it("accepte des mots de passe identiques", () => {
    expect(validatePasswordMatch("abc123", "abc123")).toBeNull();
  });
});

describe("validateRequired", () => {
  it("rejette une valeur vide", () => {
    expect(validateRequired("", "Le champ")).not.toBeNull();
    expect(validateRequired("   ", "Le champ")).not.toBeNull();
  });

  it("accepte une valeur remplie", () => {
    expect(validateRequired("texte", "Le champ")).toBeNull();
  });
});

describe("validatePrice", () => {
  it("rejette un prix négatif", () => {
    expect(validatePrice(-1)).not.toBeNull();
  });

  it("rejette un prix trop élevé", () => {
    expect(validatePrice(1500)).not.toBeNull();
  });

  it("accepte un prix valide", () => {
    expect(validatePrice(0)).toBeNull();
    expect(validatePrice(45)).toBeNull();
    expect(validatePrice(1000)).toBeNull();
  });
});

describe("sanitizeInput", () => {
  it("supprime les balises HTML", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe("scriptalert('xss')/script");
    expect(sanitizeInput("texte <b>gras</b>")).toBe("texte bgras/b");
  });

  it("laisse passer le texte normal", () => {
    expect(sanitizeInput("Jean Dupont")).toBe("Jean Dupont");
    expect(sanitizeInput("Coach à Rouen, 12 ans d'exp.")).toBe("Coach à Rouen, 12 ans d'exp.");
  });
});
