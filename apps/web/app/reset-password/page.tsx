"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
export default function Page() {
  const [status, setStatus] = useState("");
  return (
    <main id="main" className="auth-card">
      <h1>Choose a new password</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const client = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            );
            const { error } = await client.auth.updateUser({
              password: String(new FormData(e.currentTarget).get("password")),
            });
            if (error) throw error;
            setStatus("Password updated. You can sign in.");
          } catch {
            setStatus(
              "Password could not be updated. Request a new reset link.",
            );
          }
        }}
      >
        <label className="field">
          New password
          <input
            type="password"
            name="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <button className="button primary">Update password</button>
        <p role="status">{status}</p>
      </form>
    </main>
  );
}
