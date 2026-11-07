import { describe, expect, it } from "vitest";
import { isAgeAllowed } from "@/lib/dinda-prompt";

describe("idade permitida", () => {
  it("nega menores de 18", () => expect(isAgeAllowed(17)).toBe(false));
  it("aceita 18", () => expect(isAgeAllowed(18)).toBe(true));
  it("aceita 25", () => expect(isAgeAllowed(25)).toBe(true));
  it("nega maiores de 25", () => expect(isAgeAllowed(26)).toBe(false));
});
