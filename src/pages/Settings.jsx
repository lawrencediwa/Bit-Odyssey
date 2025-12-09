import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db, auth } from "../firebase";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWall, setShowWall] = useState(false);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    phone: "",
    dob: "",
    age: "",
    postal: "",
    avatar: "",
    gender: "male",
  });

  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });

  // Disable dark mode
  useEffect(() => {
    localStorage.removeItem("darkMode");
    document.documentElement.classList.remove("dark");
  }, []);

  // Load user data and check if profile is completed
  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setForm(data);
        if (data.profileCompleted) setShowWall(true);
      }
    };
    loadUserData();
  }, []);

  const handleChange = (k) => (e) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((s) => ({ ...s, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  // Save profile and show wall
  const saveToFirestore = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      { ...form, profileCompleted: true },
      { merge: true }
    );
    setShowWall(true);
    alert("Profile saved!");
  };

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setPwdForm({ current: "", next: "", confirm: "" });
  };
  const handlePwdChange = (k) => (e) =>
    setPwdForm((s) => ({ ...s, [k]: e.target.value }));
// Inside Settings component:
const handlePwdSubmit = async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  if (pwdForm.next !== pwdForm.confirm) {
    return alert("New passwords do not match.");
  }

  try {
    // Reauthenticate user with current password
    const credential = EmailAuthProvider.credential(user.email, pwdForm.current);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, pwdForm.next);

    alert("Password updated successfully!");
    closeLoginModal();
  } catch (error) {
    console.error("Password update error:", error);
    alert(error.message);
  }
};


  const discardChanges = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      phone: "",
      dob: "",
      age: "",
      postal: "",
      avatar: "",
      gender: "male",
    });
  };

  return (
    <motion.div
  className="flex flex-col lg:flex-row min-h-screen bg-gray-100"
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.3 }}
>
    <div className="w-full lg:w-64">
    <Sidebar />
</div>

      <main className="flex-1 p-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left card */}
          <aside className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img
                  src={
                    form.avatar ||
                    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23eee'/><text x='50' y='55' font-size='12' text-anchor='middle' fill='%23999'>User</text></svg>"
                  }
                  alt="avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow bg-gray-50"
                />
                {!showWall && (
                  <button
                    onClick={openFilePicker}
                    className="absolute bottom-0 right-0 bg-green-400 hover:bg-green-500 text-white p-2 rounded-full shadow-md -translate-y-1 translate-x-1"
                    title="Edit avatar"
                  >
                    ✎
                  </button>
                )}
              </div>

              <h3 className="mt-4 text-lg font-bold text-gray-800">
                {form.firstName} {form.lastName}
              </h3>
              <p className="text-sm text-gray-500">Student</p>
            </div>

            <nav className="mt-6">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab("personal")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm ${
                      activeTab === "personal"
                        ? "bg-green-50 ring-1 ring-green-200 text-green-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="bg-green-100 text-green-600 rounded-full p-2 text-xs">
                      👤
                    </span>
                    Personal Information
                  </button>
                </li>

                <li>
                  <button
                    onClick={openLoginModal}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm ${
                      showLoginModal
                        ? "bg-green-50 ring-1 ring-green-200 text-green-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="bg-gray-100 text-gray-600 rounded-full p-2 text-xs">
                      🔒
                    </span>
                    Login & Password
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Right section */}
          <section className="md:col-span-2">
            {!showWall ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Personal Information
                </h3>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-6 mb-6">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={form.gender === "male"}
                      onChange={handleChange("gender")}
                      className="form-radio text-green-500"
                    />
                    Male
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={form.gender === "female"}
                      onChange={handleChange("gender")}
                      className="form-radio text-green-500"
                    />
                    Female
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={form.firstName}
                    onChange={handleChange("firstName")}
                    placeholder="First Name"
                    className="bg-gray-100 rounded-full px-5 py-3 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <input
                    value={form.lastName}
                    onChange={handleChange("lastName")}
                    placeholder="Last Name"
                    className="bg-gray-100 rounded-full px-5 py-3 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <input
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="Email"
                    className="bg-gray-100 rounded-full px-5 py-3 text-sm col-span-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <input
                    value={form.phone}
                    onChange={handleChange("phone")}
                    placeholder="Phone Number"
                    className="bg-gray-100 rounded-full px-5 py-3 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <input
                    value={form.address}
                    onChange={handleChange("address")}
                    placeholder="Address"
                    className="bg-gray-100 rounded-full px-5 py-3 text-sm col-span-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <input
                    type="date"
                    value={form.dob}
                    onChange={handleChange("dob")}
                    className="bg-gray-100 rounded-full px-5 py-3 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <input
                    type="text"
                    value={form.age}
                    onChange={handleChange("age")}
                    placeholder="Age"
                    className="bg-gray-100 rounded-full px-5 py-3 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <input
                    value={form.postal}
                    onChange={handleChange("postal")}
                    placeholder="Postal Code"
                    className="bg-gray-100 rounded-full px-5 py-3 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={discardChanges}
                    className="flex-1 border border-green-400 text-green-600 rounded-full py-3 hover:bg-green-50 transition"
                  >
                    Discard Changes
                  </button>

                  <button
                    onClick={saveToFirestore}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full py-3 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // Profile Wall
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Your Profile Overview
                  </h3>
                  <button
                    onClick={() => setShowWall(false)}
                    className="text-green-500 hover:text-green-600 font-semibold"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow flex flex-col items-center">
                    <img
                      src={
                        form.avatar ||
                        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23eee'/><text x='50' y='55' font-size='12' text-anchor='middle' fill='%23999'>User</text></svg>"
                      }
                      alt="avatar"
                      className="w-24 h-24 rounded-full object-cover mb-2"
                    />
                    <p className="font-medium text-gray-800">
                      {form.firstName} {form.lastName}
                    </p>
                    <p className="text-gray-500">{form.gender}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">Email</p>
                    <p className="font-medium text-gray-800">{form.email}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">Phone</p>
                    <p className="font-medium text-gray-800">{form.phone}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">Address</p>
                    <p className="font-medium text-gray-800">{form.address}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">Date of Birth</p>
                    <p className="font-medium text-gray-800">{form.dob}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">Age</p>
                    <p className="font-medium text-gray-800">{form.age}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">Postal Code</p>
                    <p className="font-medium text-gray-800">{form.postal}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Login & Password Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <button
                onClick={closeLoginModal}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                ✖
              </button>

              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <form onSubmit={handlePwdSubmit} className="space-y-4">
                <div>
                  <label className="text-sm block mb-1">Current password</label>
                  <input
                    type="password"
                    value={pwdForm.current}
                    onChange={handlePwdChange("current")}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm block mb-1">New password</label>
                  <input
                    type="password"
                    value={pwdForm.next}
                    onChange={handlePwdChange("next")}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm block mb-1">Confirm new password</label>
                  <input
                    type="password"
                    value={pwdForm.confirm}
                    onChange={handlePwdChange("confirm")}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={closeLoginModal} className="px-4 py-2 rounded border">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-500 text-white">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      </motion.div>
  );
};

export default Settings;
