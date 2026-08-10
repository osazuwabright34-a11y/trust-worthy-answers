import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import logo from "@/assets/truthai-logo.png";

const SUGGESTIONS = [
  "Explain something to me.",
  "Help me solve this problem.",
  "What is the truth about…?",
  "Teach me something new.",
];

type DbMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  feedback: "up" | "down" | null;
};

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export function ChatApp({ userId, userEmail }: { userId: string; userEmail: string }) {
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [],
  );

  const { messages, setMessages, sendMessage, regenerate, status, stop } = useChat({
    id: `truthai-${userId}`,
    transport,
    onError: (error) => {
      toast.error(error.message || "The assistant could not respond. Please try again.");
    },
  });

  const focusComposer = useCallback(() => {
    window.setTimeout(() => textareaRef.current?.focus(), 30);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, feedback")
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        toast.error("Could not load your conversation.");
      } else if (data) {
        const rows = data as DbMessage[];
        setMessages(
          rows.map((row) => ({
            id: row.id,
            role: row.role,
            parts: [{ type: "text" as const, text: row.content }],
          })),
        );
        setFeedback(
          Object.fromEntries(
            rows.filter((r) => r.feedback).map((r) => [r.content.trim(), r.feedback!]),
          ),
        );
      }
      setHistoryLoaded(true);
      focusComposer();
    })();
    return () => {
      active = false;
    };
  }, [setMessages, focusComposer]);

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "ready") focusComposer();
  }, [status, focusComposer]);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || isBusy) return;
    setInput("");
    void sendMessage({ text: value });
    focusComposer();
  };

  const startNewChat = async () => {
    if (isBusy) stop();
    const { error } = await supabase.from("messages").delete().eq("user_id", userId);
    if (error) {
      toast.error("Could not start a new chat.");
      return;
    }
    setMessages([]);
    setFeedback({});
    setSearch("");
    focusComposer();
  };

  const clearChat = async () => {
    await startNewChat();
    toast.success("Conversation cleared.");
  };

  const copyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy the response.");
    }
  };

  const regenerateLast = async () => {
    if (isBusy) return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) {
      await supabase
        .from("messages")
        .delete()
        .eq("user_id", userId)
        .eq("role", "assistant")
        .eq("content", textOf(lastAssistant));
    }
    void regenerate();
  };

  const rate = async (content: string, value: "up" | "down") => {
    const next = feedback[content] === value ? null : value;
    setFeedback((prev) => {
      const copy = { ...prev };
      if (next) copy[content] = next;
      else delete copy[content];
      return copy;
    });
    const { error } = await supabase
      .from("messages")
      .update({ feedback: next })
      .eq("user_id", userId)
      .eq("role", "assistant")
      .eq("content", content);
    if (error) toast.error("Could not save your feedback.");
  };

  const query = search.trim().toLowerCase();
  const visibleMessages = query
    ? messages.filter((message) => textOf(message).toLowerCase().includes(query))
    : messages;

  const isEmpty = historyLoaded && messages.length === 0;

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="TruthAI logo" width={512} height={512} className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-tight">
                <span className="text-brand-gradient">TruthAI</span>
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Ask anything. Get an honest answer.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sign out"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this conversation"
                className="h-9 rounded-xl pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => void startNewChat()}
            >
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear chat"
              onClick={() => void clearChat()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 pb-10 pt-6 sm:px-6">
          {isEmpty ? (
            <div className="animate-rise-in py-10 text-center">
              <img
                src={logo}
                alt=""
                width={512}
                height={512}
                className="mx-auto h-16 w-16 opacity-90"
              />
              <h2 className="mt-6 text-2xl font-semibold">What would you like to know?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Honest answers, clear reasoning, and a straight "I don't know" when that's the truth.
              </p>
              <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => submit(suggestion)}
                    className="rounded-2xl border border-border bg-card p-4 text-left text-sm transition-all hover:-translate-y-0.5 hover:shadow-glow"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {query && visibleMessages.length === 0 && messages.length > 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No messages match "{search}".
            </p>
          ) : null}

          {visibleMessages.map((message) => {
            const text = textOf(message);
            const isAssistant = message.role === "assistant";
            return (
              <Message key={message.id} from={message.role} className="animate-rise-in">
                <MessageContent>
                  {isAssistant ? (
                    <MessageResponse>{text}</MessageResponse>
                  ) : (
                    <p className="whitespace-pre-wrap">{text}</p>
                  )}
                </MessageContent>
                {isAssistant && text ? (
                  <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Copy response"
                      onClick={() => void copyMessage(text)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Regenerate response"
                      onClick={() => void regenerateLast()}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Good response"
                      className={feedback[text] === "up" ? "text-primary" : ""}
                      onClick={() => void rate(text, "up")}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Bad response"
                      className={feedback[text] === "down" ? "text-destructive" : ""}
                      onClick={() => void rate(text, "down")}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </Message>
            );
          })}

          {status === "submitted" ? (
            <Shimmer className="text-sm">Thinking…</Shimmer>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
          <PromptInput
            onSubmit={(_, event) => {
              event.preventDefault();
              submit(input);
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask TruthAI anything…"
            />
            <PromptInputFooter className="justify-between">
              <span className="pl-1 text-xs text-muted-foreground">
                Signed in as {userEmail}
              </span>
              <PromptInputSubmit status={status} disabled={!input.trim() && !isBusy} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            TruthAI can be wrong. It will tell you when it isn't sure — verify anything critical.
          </p>
        </div>
      </div>
    </div>
  );
}
