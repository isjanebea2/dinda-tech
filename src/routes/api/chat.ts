import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createResponsesCall } from "@/lib/ai/responses.server";
import { buildInstructions } from "@/lib/dinda-prompt";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Configuração da IA ausente.", { status: 500 });
        const body = (await request.json()) as {
          messages?: UIMessage[];
          profile?: { name?: string; age?: number };
        };
        const messages = Array.isArray(body.messages) ? body.messages.slice(-60) : [];
        const name = String(body.profile?.name ?? "").trim().slice(0, 80);
        const age = Number(body.profile?.age);
        if (!name || !Number.isFinite(age) || age < 18 || age > 25) {
          return new Response("Perfil inválido.", { status: 400 });
        }
        const call = createResponsesCall(
          request,
          { baseURL: "https://ai.gateway.lovable.dev", apiKey, model: "openai/gpt-6-astra" },
          await convertToModelMessages(messages),
          buildInstructions(name),
        );
        return call.response();
      },
    },
  },
});
