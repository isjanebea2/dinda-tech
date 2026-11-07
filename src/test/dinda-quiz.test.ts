import { describe, expect, it } from "vitest";
import { QUIZ_QUESTIONS } from "@/lib/dinda-prompt";

describe("novo roteiro do quiz", () => {
  it("oferece exatamente oito perguntas", () => {
    expect(QUIZ_QUESTIONS).toHaveLength(8);
  });
});