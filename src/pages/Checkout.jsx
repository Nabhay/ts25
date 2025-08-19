import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cards from "react-credit-cards-2";
import "react-credit-cards-2/dist/es/styles-compiled.css";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item || null;

  const [number, setNumber] = React.useState("");
  const [name, setName] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");
  const [focus, setFocus] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [touched, setTouched] = React.useState({ number: false, name: false, expiry: false, cvc: false });

  // Helpers
  const stripNonDigits = (s) => (s || "").replace(/\D+/g, "");
  const formatCardNumber = (s) => {
    const digits = stripNonDigits(s).slice(0, 16);
    // 4-4-4-4 grouping
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  const luhn = (num) => {
    if (!num) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = num.charCodeAt(i) - 48;
      if (d < 0 || d > 9) return false;
      if (shouldDouble) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };
  const formatExpiry = (s) => {
    const digits = stripNonDigits(s).slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + "/" + digits.slice(2);
  };
  const isValidExpiry = (exp) => {
    const digits = stripNonDigits(exp);
    if (digits.length !== 4) return false;
    const mm = parseInt(digits.slice(0, 2), 10);
    const yy = parseInt(digits.slice(2), 10);
    if (!(mm >= 1 && mm <= 12)) return false;
    const now = new Date();
    const curYY = now.getFullYear() % 100;
    const curMM = now.getMonth() + 1;
    if (yy < curYY) return false;
    if (yy === curYY && mm < curMM) return false;
    return true;
  };

  // Derived
  const rawNumber = React.useMemo(() => stripNonDigits(number), [number]);
  const numberValid = React.useMemo(() => rawNumber.length === 16, [rawNumber]);
  const expiryValid = React.useMemo(() => isValidExpiry(expiry), [expiry]);
  const cvcValid = React.useMemo(() => /^\d{3}$/.test(stripNonDigits(cvc)), [cvc]);
  const nameValid = React.useMemo(() => (name || "").trim().length >= 2, [name]);
  const formValid = numberValid && expiryValid && cvcValid && nameValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!formValid) {
      setTouched({ number: true, name: true, expiry: true, cvc: true });
      return;
    }
    setSubmitting(true);
    // Fake payment processing
    await new Promise((r) => setTimeout(r, 1200));

  // On success, add game to library (backend only); do NOT mark as installed
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (user && item && item.id != null) {
        try {
          await fetch(`/api/library/${encodeURIComponent(user.username)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: Number(item.id), name: item.name }),
          });
        } catch {
          // ignore network error, still update local
        }
      }
    } finally {
      setSubmitting(false);
    }

    // Go to Games so ownership reflects immediately
    navigate("/home/games");
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 16px" }}>
      <h1>Checkout</h1>
      {item ? (
        <div style={{ marginBottom: 16, opacity: 0.9 }}>
          Purchasing: <strong>{item.name}</strong>
        </div>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <Cards number={number} name={name} expiry={expiry} cvc={cvc} focused={focus} />
        </div>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, alignContent: "start" }} noValidate>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Card Number</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              value={number}
              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
              onFocus={() => setFocus("number")}
              onBlur={() => setTouched((t) => ({ ...t, number: true }))}
              style={{ borderRadius: 8, padding: "10px 12px", border: `1px solid ${touched.number && !numberValid ? "#f44336" : "#333"}`, background: "#151515", color: "#fff" }}
              required
            />
            {touched.number && !numberValid ? (
              <small style={{ color: "#f44336" }}>Enter a valid 16-digit card number</small>
            ) : null}
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Name on Card</span>
            <input
              type="text"
              autoComplete="cc-name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocus("name")}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              style={{ borderRadius: 8, padding: "10px 12px", border: `1px solid ${touched.name && !nameValid ? "#f44336" : "#333"}`, background: "#151515", color: "#fff" }}
              required
            />
            {touched.name && !nameValid ? (
              <small style={{ color: "#f44336" }}>Enter the name as it appears on the card</small>
            ) : null}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Expiry</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                onFocus={() => setFocus("expiry")}
                onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
                style={{ borderRadius: 8, padding: "10px 12px", border: `1px solid ${touched.expiry && !expiryValid ? "#f44336" : "#333"}`, background: "#151515", color: "#fff" }}
                required
              />
              {touched.expiry && !expiryValid ? (
                <small style={{ color: "#f44336" }}>Enter a valid future date in MM/YY</small>
              ) : null}
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>CVC</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                value={cvc}
                onChange={(e) => {
                  const d = stripNonDigits(e.target.value).slice(0, 3);
                  setCvc(d);
                }}
                onFocus={() => setFocus("cvc")}
                onBlur={() => setTouched((t) => ({ ...t, cvc: true }))}
                style={{ borderRadius: 8, padding: "10px 12px", border: `1px solid ${touched.cvc && !cvcValid ? "#f44336" : "#333"}`, background: "#151515", color: "#fff" }}
                required
              />
              {touched.cvc && !cvcValid ? (
                <small style={{ color: "#f44336" }}>CVC must be 3 digits</small>
              ) : null}
            </label>
          </div>
          <button type="submit" disabled={submitting || !formValid} style={{ borderRadius: 10, padding: "10px 14px", background: formValid ? "#2196f3" : "#395a72", color: "#fff", border: "none", cursor: formValid ? "pointer" : "not-allowed", opacity: submitting ? 0.8 : 1 }}>
            {submitting ? "Processing…" : "Pay now"}
          </button>
        </form>
      </div>
    </div>
  );
}
