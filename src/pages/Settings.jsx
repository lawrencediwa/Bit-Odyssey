import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const Settings = () => {
  const userId = "currentUser"; // 🔧 Replace later with actual user.uid from Firebase Auth
  const [profile, setProfile] = useState({
    name: "",
    role: "",
    photo: "",
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // 🔄 Listen to profile changes in Firestore
  useEffect(() => {
    const ref = doc(db, "users", userId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      }
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  // 💾 Save updated profile to Firestore
  const handleSave = async (e) => {
    e.preventDefault();
    const ref = doc(db, "users", userId);
    await setDoc(
      ref,
      {
        ...profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setEditMode(false);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />

      <main className="flex-1 p-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Profile Settings
        </h2>

        <div className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
          {/* Profile Section */}
          <div className="flex flex-col items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Profile
            </h3>

            {/* Profile Photo */}
            <img
              src={
                profile.photo ||
                "https://via.placeholder.com/120?text=Profile"
              }
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border mb-3"
            />

            {editMode && (
              <input
                type="text"
                placeholder="Profile Image URL"
                value={profile.photo}
                onChange={(e) =>
                  setProfile({ ...profile, photo: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm w-64"
              />
            )}
          </div>

          {/* Profile Info */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2 w-full"
                />
              ) : (
                <p className="text-gray-800 mt-1">{profile.name || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) =>
                    setProfile({ ...profile, role: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2 w-full"
                />
              ) : (
                <p className="text-gray-800 mt-1">{profile.role || "—"}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              {editMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;
