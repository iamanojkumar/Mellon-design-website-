"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";
import styles from "./login.module.css";

const initialState: LoginState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className={styles.card} noValidate>
      <div className={styles.eyebrow}>Mellon</div>
      <h1 className={styles.title}>Admin</h1>
      <label className={styles.field}>
        <span>Password</span>
        <input type="password" name="password" autoComplete="current-password" required autoFocus />
      </label>
      {state.status === "error" && (
        <p className={styles.error} role="alert">
          Incorrect password.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
