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
      {
        title: "XENONAPEX ai — Honest answers from an AI you can trust",
      },
      {
        name: "description",
        content:
          "XENONAPEX ai is an AI assistant built for honesty: clear reasoning, accurate answers, and a straight 'I don't know' when it isn't sure.",
      },
      {
        property: "og:title",
        content: "XENONAPEX ai — Honest answers from an AI you can trust",
      },
      {
        property: "og:description",
        content:
          "Chat with XENONAPEX ai for clear, accurate, honest answers.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Supabase session error:", error);

          if (mounted) {
            setSession(null);
            setReady(true);
          }

          return;
        }

        if (mounted) {
          setSession(data.session ?? null);
          setReady(true);
        }
      } catch (error) {
        console.error("Unable to restore session:", error);

        if (mounted) {
          setSession(null);
          setReady(true);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession ?? null);
      setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-label="Loading"
        />
      </main>
    );
  }

  if (!session) {
    return <AuthPanel />;
  }

  return (
    <ChatApp
      userId={session.user.id}
      userEmail={session.user.email ?? "your account"}
    />
  );
}