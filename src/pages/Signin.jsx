import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // adjust path if needed
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const Signin = () => {
  const navigate = useNavigate(); // ✅ must be inside component
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: replace with real signin logic
    navigate("/dashboard");
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // The signed-in user info
      const user = result.user;
      console.log("Google user:", user);

      // Redirect to dashboard after successful login
      navigate("/dashboard");
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-2xl font-bold mb-2 text-gray-800">Welcome back</h3>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:outline-none"
          />
          <input
            required
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:outline-none"
          />

          <div className="flex items-center justify-between text-sm text-gray-500">
            <button
              type="button"
              onClick={() => navigate("/forgetpass")}
              className="text-gray-400 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
          >
            Sign in
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="text-xs text-gray-400">or</div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn} // ✅ inside component
            className="w-full py-3 rounded-xl border flex items-center justify-center gap-2"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="g"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          <p className="text-sm text-gray-500 text-center">
            New here?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-green-600 font-medium"
            >
              Create account
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signin;
