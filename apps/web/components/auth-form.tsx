"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
export function AuthForm({
  mode,
}: {
  mode: "login" | "signup" | "forgot-password";
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setStatus("");
        try {
          const f = new FormData(e.currentTarget);
          const c = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          );
          const email = String(f.get("email")),
            password = String(f.get("password"));
          const result =
            mode === "login"
              ? await c.auth.signInWithPassword({ email, password })
              : mode === "signup"
                ? await c.auth.signUp({
                    email,
                    password,
                    options: {
                      emailRedirectTo: location.origin + "/auth/callback",
                    },
                  })
                : await c.auth.resetPasswordForEmail(email, {
                    redirectTo:
                      location.origin + "/auth/callback?next=/reset-password",
                  });
          if (result.error) throw result.error;
          if (mode === "login") location.assign("/dashboard");
          else setStatus("Check your email for the next step.");
        } catch {
          setStatus(
            "Unable to complete authentication. Check your details and try again.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {!configured && (
        <div className="notice">
          Account services are not connected in this environment. Registration
          and login are unavailable until Supabase is configured.
        </div>
      )}
      <label className="field">
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      {mode !== "forgot-password" && (
        <label className="field">
          Password
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            required
            minLength={12}
            maxLength={128}
          />
        </label>
      )}
      <button className="button primary" disabled={!configured || busy}>
        {busy
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : mode === "signup"
              ? "Create account"
              : "Send reset email"}
      </button>
      <p className="form-status" role="status">
        {status}
      </p>
      <p>
        <Link href={mode === "login" ? "/signup" : "/login"}>
          {mode === "login" ? "Create an account" : "Back to sign in"}
        </Link>
        {mode === "login" && (
          <>
            {" "}
            · <Link href="/forgot-password">Forgot password?</Link>
          </>
        )}
      </p>
    </form>
  );
}
