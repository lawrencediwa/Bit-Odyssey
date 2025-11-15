import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // adjust path if needed
import { createUserWithEmailAndPassword } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { collection } from "firebase/firestore";


const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
    const user = userCredential.user;

    // Create user Firestore document
    await setDoc(doc(db, "users", user.uid), {
      firstName: "",
      lastName: "",
      email: form.email,
      address: "",
      phone: "",
      dob: "",
      location: "",
      postal: "",
      avatar: "",
      gender: "male",
    });

    // -------------------------------
    // CREATE EMPTY SUBCOLLECTIONS HERE
    // -------------------------------

    await setDoc(doc(collection(db, "users", user.uid, "classes")), {
      initialized: true,
    });

    await setDoc(doc(collection(db, "users", user.uid, "expenses")), {
      initialized: true,
    });

    navigate("/dashboard");
  } catch (error) {
    console.error("Signup error:", error);
    alert(error.message);
  }
};


const handleGoogleSignUp = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // Create Firestore user doc
      await setDoc(userRef, {
        firstName: "",
        lastName: "",
        email: user.email,
        address: "",
        phone: "",
        dob: "",
        location: "",
        postal: "",
        avatar: "",
        gender: "male",
      });

      // -------------------------------
      // CREATE EMPTY SUBCOLLECTIONS HERE
      // -------------------------------

      await setDoc(doc(collection(db, "users", user.uid, "classes")), {
        initialized: true,
      });

      await setDoc(doc(collection(db, "users", user.uid, "expenses")), {
        initialized: true,
      });
    }

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
            <input required type="password" value={form.password} onChange={handleChange("password")} placeholder="Password" className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:outline-none" />

            <button type="submit" className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700">Create account</button>

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
