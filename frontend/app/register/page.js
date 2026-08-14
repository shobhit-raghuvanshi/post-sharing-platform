"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import styles from "../components/auth.module.css";

export default function RegisterPage() {
  const { register } = useAuth();

  // Controlled form fields
  const [fullname, setFullname] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState(""); // confirm password — not sent to the API

  // UI state
  const [errors, setErrors]     = useState({});   // per-field client validation errors
  const [apiError, setApiError] = useState("");    // error returned by the server
  const [loading, setLoading]   = useState(false); // disables submit while waiting

  /**
   * Client-side validation — runs before any network call.
   * Returns a { fieldName: message } map; empty = form is valid.
   */
  function validate() {
    const e = {};
    if (!fullname.trim())                            e.fullname = "Full name is required";
    if (!email.trim())                               e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))            e.email    = "Enter a valid email";
    if (!password)                                   e.password = "Password is required";
    else if (password.length < 6)                    e.password = "Minimum 6 characters";
    if (!confirm)                                    e.confirm  = "Please confirm your password";
    else if (confirm !== password)                   e.confirm  = "Passwords do not match";
    return e;
  }

  /** Handle form submission: validate → register() → catch API errors. */
  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    try {
      // AuthContext.register calls the API then auto-logs in and redirects
      await register(fullname, email, password);
    } catch (err) {
      setApiError(err.message); // e.g. "email already registered"
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Brand link at the top of the card */}
        <Link href="/" className={styles.brand}>Postly</Link>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Join Postly and start sharing</p>

        {/* noValidate disables native browser validation so we control the UX */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* API error banner */}
          {apiError && (
            <div className={styles.errorBanner}>
              <span>⚠</span> {apiError}
            </div>
          )}

          {/* Full name field */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="fullname">Full name</label>
            <input
              id="fullname"
              type="text"
              className={`${styles.input} ${errors.fullname ? styles.inputError : ""}`}
              placeholder="Jane Doe"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              autoComplete="name"
            />
            {errors.fullname && <p className={styles.fieldError}>{errors.fullname}</p>}
          </div>

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
              autoComplete="new-password"
            />
            {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
          </div>

          {/* Confirm password field */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              className={`${styles.input} ${errors.confirm ? styles.inputError : ""}`}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            {errors.confirm && <p className={styles.fieldError}>{errors.confirm}</p>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        {/* Link to login page */}
        <p className={styles.footer}>
          Already have an account?{" "}
          <Link href="/login" className={styles.footerLink}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
