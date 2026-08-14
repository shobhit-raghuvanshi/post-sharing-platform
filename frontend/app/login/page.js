"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import styles from "../components/auth.module.css";

export default function LoginPage() {
  const { login } = useAuth();

  // Controlled form fields
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [errors, setErrors]     = useState({});   // per-field client validation errors
  const [apiError, setApiError] = useState("");    // error returned by the server
  const [loading, setLoading]   = useState(false); // disables the submit button while waiting

  // Client-side validation — runs before any network call
  function validate() {
    const e = {};
    if (!email.trim())                         e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))      e.email    = "Enter a valid email";
    if (!password)                             e.password = "Password is required";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    try {
      await login(email, password); // AuthContext handles token storage + redirect
    } catch (err) {
      setApiError(err.message); // display the message thrown by AuthContext.login
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Brand link at the top of the card */}
        <Link href="/" className={styles.brand}>Postly</Link>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to your account</p>

        {/* noValidate disables native browser validation so we control the UX */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* API error banner — shown when the server rejects the credentials */}
          {apiError && (
            <div className={styles.errorBanner}>
              <span>⚠</span> {apiError}
            </div>
          )}

          {/* Email field */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
          </div>

          {/* Password field */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        {/* Link to register page */}
        <p className={styles.footer}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className={styles.footerLink}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
