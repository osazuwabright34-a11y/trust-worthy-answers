import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthPanel } from "@/components/auth-panel";
import { ChatApp } from "@/components/chat-app";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "TruthAI — Honest answers from an AI you can trust" },
      {
        name: "description",
        content:
          "TruthAI is an AI assistant built for honesty: clear reasoning, accurate answers, and a straight 'I don't know' when it isn't sure.",
      },
      { property: "og:title", content: "TruthAI — Honest answers from an AI you can trust" },
      {
        property: "og:description",
        content:
          "Chat with TruthAI for clear, accurate, honest answers. Your conversation is stored privately in your account.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!session) return <AuthPanel />;

  return <ChatApp userId={session.user.id} userEmail={session.user.email ?? "your account"} />;
}
