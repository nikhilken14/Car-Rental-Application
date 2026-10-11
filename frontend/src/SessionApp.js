import React, { useEffect, useState } from "react";
import RentalApp from "./App";
import { getSession, login, logout, register, errorMessage } from "./api";
export default function SessionApp() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [showAuth, setShowAuth] = useState(false),
    [mode, setMode] = useState("login"),
    [role, setRole] = useState("CUSTOMER"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [form, setForm] = useState({ name: "", email: "", password: "" });
  useEffect(() => {
    let active = true;
    getSession()
      .then(({ data }) => {
        if (active) setUser(data);
      })
      .catch((e) => {
        if (active && e.response?.status !== 401)
          setMessage(
            "Cannot reach the backend. Start Spring Boot, then refresh.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    const expired = () => {
      setUser(null);
      setMessage("Your session expired. Sign in again to continue.");
    };
    window.addEventListener("roam:session-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("roam:session-expired", expired);
    };
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        await register({ ...form, role });
        setMode("login");
        setForm({ ...form, password: "" });
        setMessage("Account created. Sign in with your new password.");
      } else {
        const { data } = await login({
          email: form.email,
          password: form.password,
          role,
        });
        setUser(data);
        setShowAuth(false);
        setForm({ name: "", email: "", password: "" });
        setMessage("");
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      await logout();
      setUser(null);
      setShowAuth(false);
      setMessage("You have signed out.");
    } catch (e) {
      if (e.response?.status === 401) setUser(null);
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <div className="session-loading" role="status">
        Opening your Roam experience…
      </div>
    );
  if (showAuth)
    return (
      <div className="auth-page">
        <aside className="auth-story">
          <a
            className="brand"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              if (!busy) setShowAuth(false);
            }}
          >
            roam®
          </a>
          <p className="eyebrow">TWO PORTALS. ONE OPEN ROAD.</p>
          <h1>
            {role === "CUSTOMER"
              ? "Your next ride starts here."
              : "Your fleet. Your business."}
          </h1>
          <p>
            {role === "CUSTOMER"
              ? "Find your ride, compare your favorites and keep track of your active rentals."
              : "Manage your vehicles, see who has rented them and keep your fleet ready to go."}
          </p>
          <ul>
            {(role === "CUSTOMER"
              ? [
                  "Browse and compare rides",
                  "Book with a clear price",
                  "View your active rentals",
                ]
              : [
                  "Add and delete your own rides",
                  "View rented cars and customer details",
                  "Confirm returns and track availability",
                ]
            ).map((text) => (
              <li key={text}>✓ {text}</li>
            ))}
          </ul>
        </aside>
        <main className="auth-main">
          <button
            className="auth-back"
            disabled={busy}
            onClick={() => setShowAuth(false)}
          >
            ← Back to fleet
          </button>
          <div className="auth-card">
            <p className="eyebrow">WELCOME TO ROAM</p>
            <h2>
              {mode === "login" ? "Welcome back." : "Start your journey."}
            </h2>
            <div
              className="portal-toggle"
              role="group"
              aria-label="Choose account portal"
            >
              <button
                disabled={busy}
                aria-pressed={role === "CUSTOMER"}
                className={role === "CUSTOMER" ? "active" : ""}
                onClick={() => {
                  setRole("CUSTOMER");
                  setError("");
                }}
              >
                Customer login
              </button>
              <button
                disabled={busy}
                aria-pressed={role === "RENTER"}
                className={role === "RENTER" ? "active" : ""}
                onClick={() => {
                  setRole("RENTER");
                  setError("");
                }}
              >
                Renter login
              </button>
            </div>
            <p className="auth-help">
              {role === "RENTER"
                ? "Renter = vehicle owner / fleet provider."
                : "Customer = person booking a vehicle."}
            </p>
            {message && (
              <p role="status" className="notice">
                {message}
              </p>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <form className="dialog-form" onSubmit={submit}>
              {mode === "register" && (
                <label>
                  Full name
                  <input
                    autoComplete="name"
                    required
                    maxLength="100"
                    value={form.name}
                    disabled={busy}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
              )}
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="username"
                  required
                  maxLength="254"
                  value={form.email}
                  disabled={busy}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  minLength={mode === "register" ? 8 : 1}
                  maxLength="72"
                  required
                  value={form.password}
                  disabled={busy}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </label>
              <button className="button dark" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "login"
                    ? `Sign in as ${role === "RENTER" ? "renter" : "customer"} ↗`
                    : "Create account ↗"}
              </button>
            </form>
            <p className="auth-switch">
              {mode === "login" ? "New to Roam?" : "Already have an account?"}{" "}
              <button
                disabled={busy}
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                  setMessage("");
                }}
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </main>
      </div>
    );
  return (
    <>
      {message && (
        <div className="session-message" role="status">
          {message}
          <button
            onClick={() => setMessage("")}
            aria-label="Dismiss session message"
          >
            ×
          </button>
        </div>
      )}
      <RentalApp
        key={user?.id || "guest"}
        user={user}
        onSignIn={() => {
          setShowAuth(true);
          setMode("login");
          setError("");
        }}
        onLogout={signOut}
        sessionBusy={busy}
      />
    </>
  );
}
