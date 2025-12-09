import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // adjust path if needed
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [pwFocused, setPwFocused] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");

  const handleChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const passwordRules = [
    { key: "length", label: "At least 12 characters" },
    { key: "lower", label: "Lowercase letter" },
    { key: "upper", label: "Uppercase letter" },
    { key: "number", label: "Number (0-9)" },
    { key: "special", label: "Special character (e.g. !@#$%)" },
    { key: "noSpaces", label: "No spaces" },
  ];

  const validatePassword = (pw) => {
    const checks = {
      length: pw && pw.length >= 12,
      lower: /[a-z]/.test(pw || ""),
      upper: /[A-Z]/.test(pw || ""),
      number: /[0-9]/.test(pw || ""),
      special: /[^A-Za-z0-9]/.test(pw || ""),
      noSpaces: !/\s/.test(pw || ""),
    };

    const errors = Object.keys(checks).filter((k) => !checks[k]);
    const score = Object.values(checks).filter(Boolean).length;

    return { valid: errors.length === 0, errors, score, checks };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");
    setAgreeError("");

    const result = validatePassword(form.password);
    if (!result.valid) {
      setSignupError("Password must meet all requirements");
      return;
    }

    if (form.password !== form.confirm) {
      setSignupError("Passwords do not match");
      return;
    }

    if (!agreed) {
      setAgreeError("You must agree to the Terms & Conditions to create an account.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      console.log("User created:", userCredential.user);
      navigate("/dashboard");
    } catch (error) {
      setSignupError(error.message);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google user:", user);
      navigate("/dashboard");
    } catch (error) {
      console.error("Google sign-up error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-5xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* left promo panel */}
        <div className="hidden md:flex flex-col items-center justify-center p-10 bg-gradient-to-br from-green-600 to-emerald-500 text-white">
          <div className="w-36 h-36 rounded-full bg-white/10 mb-6 flex items-center justify-center">
            <svg className="w-20 h-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zM5 20v-1a4 4 0 014-4h6a4 4 0 014 4v1" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Join GreenMate</h2>
          <p className="text-sm text-white/90 max-w-xs text-center">
            Manage classes, track spending and measure impact — all in one app.
          </p>
        </div>

        {/* right form */}
        <div className="p-10">
          <h3 className="text-2xl font-bold mb-2 text-gray-800">Create account</h3>
          <p className="text-sm text-gray-500 mb-6">Start your free account — no credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input required value={form.name} onChange={handleChange("name")} placeholder="Full name" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:outline-none" />
            <input required type="email" value={form.email} onChange={handleChange("email")} placeholder="Email address" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:outline-none" />

            <div>
              <input
                required
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:outline-none"
              />
              <input
                required
                type="password"
                value={form.confirm}
                onChange={handleChange("confirm")}
                placeholder="Confirm Password"
                className="w-full px-4 py-3 mt-2 rounded-xl border bg-gray-50 focus:outline-none"
              />

              {/* Strength bar and rules */}
              <div className="mt-2">
                {form.password && (() => {
                  const { score } = validatePassword(form.password);
                  const percent = Math.round((score / passwordRules.length) * 100);
                  let barColor = "bg-red-400";
                  if (percent >= 90) barColor = "bg-green-500";
                  else if (percent >= 70) barColor = "bg-yellow-400";
                  else if (percent >= 50) barColor = "bg-orange-400";

                  return (
                    <div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`${barColor} h-2`} style={{ width: `${percent}%` }} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Strength: {percent}%</div>
                    </div>
                  );
                })()}

                {(pwFocused || form.password) && (
                  <ul className="mt-3 text-xs text-gray-600 space-y-1">
                    {passwordRules.map((r) => {
                      const ok = validatePassword(form.password).checks[r.key];
                      return (
                        <li key={r.key} className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${ok ? "bg-green-500" : "bg-gray-300"}`} />
                          <span className={ok ? "text-gray-700" : "text-gray-400"}>{r.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="agree" className="text-sm text-gray-700">
                I agree to the{' '}
                <button type="button" onClick={() => navigate('/terms')} className="text-green-600 underline">
                  Terms &amp; Conditions
                </button>
              </label>
            </div>

            <div>
              <button type="submit" className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700">Create account</button>
              {signupError && <div className="mt-2 text-sm text-red-600">{signupError}</div>}
              {agreeError && <div className="mt-2 text-sm text-red-600">{agreeError}</div>}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <div className="text-xs text-gray-400">or</div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full py-3 rounded-xl border flex items-center justify-center gap-2"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="g" className="w-5 h-5" />
              Continue with Google
            </button>

            <p className="text-sm text-gray-500 text-center">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/signin")} className="text-green-600 font-medium">
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
