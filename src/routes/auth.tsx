import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in — Scout" },
    { name: "description", content: "Sign in to your Scout antique sourcing workspace." },
    { property: "og:title", content: "Sign in — Scout" },
    { property: "og:description", content: "Access your private Scout dealer workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmail(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setLoading(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === "signup" && !result.data.session) { setMessage("Check your email to confirm your account."); return; }
    void navigate({ to: "/" });
  }

  async function handleGoogle() {
    setLoading(true); setMessage("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setMessage(result.error.message); setLoading(false); return; }
    if (!result.redirected) void navigate({ to: "/" });
  }

  return <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]"><section className="relative hidden overflow-hidden bg-primary lg:block"><div className="absolute inset-0 opacity-20 [background-image:linear-gradient(var(--color-primary-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--color-primary-foreground)_1px,transparent_1px)] [background-size:80px_80px]" /><div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground"><div className="font-display text-3xl">Scout</div><div className="max-w-xl"><p className="text-xs uppercase tracking-[0.2em] opacity-70">Dealer intelligence</p><h1 className="mt-5 font-display text-6xl leading-[1.02]">Spend less time searching. Find the pieces that matter.</h1><p className="mt-6 max-w-md text-sm leading-7 opacity-75">A private sourcing workspace that screens European marketplaces against your periods, categories and commercial thresholds.</p></div><p className="text-xs opacity-60">Built for antique and vintage furniture dealers</p></div></section><section className="flex items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-sm"><div className="mb-10 lg:hidden"><div className="font-display text-3xl">Scout</div><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Dealer intelligence</p></div><p className="eyebrow">Private workspace</p><h2 className="mt-2 font-display text-4xl">{mode === "signin" ? "Welcome back" : "Create your account"}</h2><p className="mt-3 text-sm text-muted-foreground">{mode === "signin" ? "Continue to today’s screened opportunities." : "Set up your dealer profile in under a minute."}</p><Button variant="outline" className="mt-8 h-11 w-full" onClick={handleGoogle} disabled={loading}><span className="text-base font-semibold">G</span> Continue with Google</Button><div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" /></div><form onSubmit={handleEmail} className="space-y-5"><div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11" required /></div><div><Label htmlFor="password">Password</Label><div className="relative mt-2"><Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} className="h-11 pr-11" required /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></div>{message && <p role="status" className="text-sm text-destructive">{message}</p>}<Button className="h-11 w-full" disabled={loading}>{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}<ArrowRight /></Button></form><p className="mt-7 text-center text-sm text-muted-foreground">{mode === "signin" ? "New to Scout?" : "Already have an account?"} <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} className="font-medium text-primary hover:underline">{mode === "signin" ? "Create account" : "Sign in"}</button></p></div></section></main>;
}