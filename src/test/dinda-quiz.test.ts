import { describe, expect, it } from "vitest";
import { MAX_QUIZ_QUESTIONS, QUIZ_QUESTIONS } from "@/lib/dinda-prompt";

describe("novo roteiro do quiz", () => {
  it("limita o banco a no máximo três perguntas", () => {
    expect(MAX_QUIZ_QUESTIONS).toBe(3);
    expect(QUIZ_QUESTIONS.length).toBeGreaterThan(0);
    expect(QUIZ_QUESTIONS.length).toBeLessThanOrEqual(3);
  });
});