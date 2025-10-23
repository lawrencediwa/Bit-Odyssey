import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";


const Settings = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const fileInputRef = useRef(null);
  // disable dark mode: remove any saved preference and ensure light theme now
  useEffect(() => {
    try {
      localStorage.removeItem("darkMode");
      document.documentElement.classList.remove("dark");
    } catch (e) {
      /* ignore */
    }
  }, []);
useEffect(() => {
  const loadUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      setForm(snap.data());
    }
  };

  loadUserData();
}, []);

  // login/password modal state + simple form
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setPwdForm({ current: "", next: "", confirm: "" });
  };
  const handlePwdChange = (k) => (e) => setPwdForm((s) => ({ ...s, [k]: e.target.value }));
  const handlePwdSubmit = (e) => {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) return alert("New passwords do not match.");
    // replace with real update logic
    alert("Password updated (demo)");
    closeLoginModal();
  };

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    phone: "",
    dob: "",
    location: "",
    postal: "",
    avatar: "",
    gender: "male",
  });

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
  const saveToFirestore = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, form, { merge: true });
  alert("Profile saved!");
};


  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />

      <main className="flex-1 p-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left card */}
          <aside className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img
                  src={form.avatar || ""}
                  alt="avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow bg-gray-50"
                />
                <button
                  onClick={openFilePicker}
                  className="absolute bottom-0 right-0 bg-green-400 hover:bg-green-500 text-white p-2 rounded-full shadow-md -translate-y-1 translate-x-1"
                  title="Edit avatar"
                >
                  ✎
                </button>
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

                {/* Dark mode removed */}
              </ul>
            </nav>
          </aside>

          {/* Right form */}
          <section className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Personal Information
            </h3>

            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-4">
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
                value={form.address}
                onChange={handleChange("address")}
                placeholder="Address"
                className="bg-gray-100 rounded-full px-5 py-3 text-sm col-span-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
              />

              <input
                value={form.phone}
                onChange={handleChange("phone")}
                placeholder="Phone Number"
                className="bg-gray-100 rounded-full px-5 py-3 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
              />
              <input
                value={form.dob}
                onChange={handleChange("dob")}
                type="date"
                className="bg-gray-100 rounded-full px-5 py-3 text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
              />

              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={handleChange("location")}
                className="appearance-none bg-gray-100 rounded-full px-5 py-3 text-sm col-span-1 border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
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
                onClick={() =>
                  setForm({
                    firstName: "",
                    lastName: "",
                    email: "",
                    address: "",
                    phone: "",
                    dob: "",
                    location: "",
                    postal: "",
                    avatar: "",
                    gender: "male",
                  })
                }
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
    </div>
  );
};

export default Settings;