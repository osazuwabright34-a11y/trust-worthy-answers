import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/truthai-logo.png";

export function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setSentConfirmation(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm animate-rise-in">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="XENONAPEX ai logo" width={512} height={512} className="h-14 w-14" />
          <h1 className="mt-5 text-4xl font-semibold">
            <span className="text-brand-gradient">XENONAPEX ai</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Ask anything. Get an honest answer.</p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
          {sentConfirmation ? (
            <div className="space-y-3 text-center">
              <h2 className="text-lg font-semibold">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Open it to finish creating your account.
              </p>
              <Button variant="ghost" className="w-full" onClick={() => setSentConfirmation(false)}>
                Back
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="space-y-3">
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
                <Input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl"
                />
                <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
                  {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl"
                onClick={signInWithGoogle}
              >
                Continue with Google
              </Button>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "New to XENONAPEX ai?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your conversation is stored privately and only you can read it.
        </p>
      </div>
    </main>
  );
}
