import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sun } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Mode = "signin" | "signup";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username: username || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Konto opprettet — du er logget inn ☀️");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Velkommen tilbake");
        navigate("/");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Noe gikk galt";
      // Vanlig Supabase-feil: bytt til norsk-vennlig
      if (/invalid login/i.test(message)) toast.error("Feil e-post eller passord");
      else if (/already registered/i.test(message)) toast.error("E-posten er allerede i bruk");
      else toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-night via-sunset-purple to-primary px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-10 text-white">
      <div className="flex items-center justify-between">
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-full glass-dark tap-scale">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-sun shadow-glow">
          <Sun className="h-5 w-5 text-night" strokeWidth={2.5} />
        </div>
      </div>

      <div className="mt-10">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Utefolket</div>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">
          Bli en del av Utefolket
        </h1>
        <p className="mt-2 text-sm opacity-85">
          Bidra til å vise hvor sola står lengst, ølen er billigst og stemningen er best.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        {mode === "signup" && (
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Brukernavn (valgfritt)"
            className="w-full rounded-2xl bg-white/15 px-5 py-4 text-sm placeholder:text-white/60 outline-none ring-1 ring-white/20 backdrop-blur-xl focus:ring-white/60"
            autoComplete="username"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-post"
          className="w-full rounded-2xl bg-white/15 px-5 py-4 text-sm placeholder:text-white/60 outline-none ring-1 ring-white/20 backdrop-blur-xl focus:ring-white/60"
          autoComplete="email"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passord (min 6 tegn)"
          className="w-full rounded-2xl bg-white/15 px-5 py-4 text-sm placeholder:text-white/60 outline-none ring-1 ring-white/20 backdrop-blur-xl focus:ring-white/60"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />

        <button
          type="submit"
          disabled={submitting}
          className="tap-scale w-full rounded-full bg-sun py-4 font-semibold text-night shadow-glow disabled:opacity-60"
        >
          {submitting ? "Et øyeblikk…" : mode === "signin" ? "Logg inn" : "Opprett konto"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        {mode === "signin" ? (
          <button onClick={() => setMode("signup")} className="opacity-90 underline-offset-4 hover:underline">
            Ny her? Opprett konto
          </button>
        ) : (
          <button onClick={() => setMode("signin")} className="opacity-90 underline-offset-4 hover:underline">
            Har du konto? Logg inn
          </button>
        )}
      </div>

      <p className="mt-10 text-center text-xs opacity-70">Laget med ☀️ av Utefolket</p>
    </div>
  );
};

export default Auth;
