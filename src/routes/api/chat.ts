import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { TRUTHAI_SYSTEM_PROMPT } from "@/lib/system-prompt";

type ChatRequestBody = { messages?: unknown };

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

async function persist(
  supabase: SupabaseClient,
  userId: string,
  role: "user" | "assistant",
  content: string,
) {
  if (!content) return;
  const { error } = await supabase.from("messages").insert({ user_id: userId, role, content });
  if (error) console.error("Failed to persist message:", error.message);
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabaseUrl = process.env["SUPABASE_URL"];
        const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!supabaseUrl || !publishableKey) {
          return new Response("Backend is not configured", { status: 500 });
        }
        if (!apiKey) return new Response("AI is not configured", { status: 500 });

        const supabase = createClient(supabaseUrl, publishableKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }
        const uiMessages = messages as UIMessage[];

        const last = uiMessages[uiMessages.length - 1]!;
        if (last.role === "user") {
          const content = textOf(last);
          const { data: recent } = await supabase
            .from("messages")
            .select("role, content")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1);
          const latest = recent?.[0];
          const alreadySaved = latest?.role === "user" && latest?.content === content;
          if (!alreadySaved) await persist(supabase, userId, "user", content);
        }

        const gateway = createLovableAiGatewayProvider(apiKey);

        try {
          const result = streamText({
            model: gateway("google/gemini-3.6-flash"),
            system: TRUTHAI_SYSTEM_PROMPT,
            messages: await convertToModelMessages(uiMessages),
            onFinish: async ({ text }) => {
              await persist(supabase, userId, "assistant", text.trim());
            },
          });

          return result.toUIMessageStreamResponse({
            originalMessages: uiMessages,
            onError: (error) => {
              console.error("Chat stream error:", error);
              const message = error instanceof Error ? error.message : String(error);
              if (message.includes("429")) return "Too many requests right now. Please retry shortly.";
              if (message.includes("402")) return "AI credits are exhausted for this workspace.";
              return "Something went wrong while generating the answer.";
            },
          });
        } catch (error) {
          console.error("Chat request failed:", error);
          return new Response("Failed to reach the AI model", { status: 502 });
        }
      },
    },
  },
});
