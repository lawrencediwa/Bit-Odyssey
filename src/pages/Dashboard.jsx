import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import Sidebar from "./Sidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState("Today");
  const [filtered, setFiltered] = useState([]);
  const [total, setTotal] = useState(0);
  const [co2, setCo2] = useState(0);
  const [classes, setClasses] = useState([]);

    // ✅ Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatar: "",
  });

  // ✅ Sync profile from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setProfile(snap.data());
    });

    return () => unsub();
  }, []);

  // only show classes that are not done on the dashboard
  const visibleClasses = classes.filter((c) => c.status !== "Completed" && c.status !== "done");

  // format helpers used in JSX
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString();
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = String(timeStr).split(":").map(Number);
    if (Number.isNaN(h)) return timeStr;
    const period = h >= 12 ? "PM" : "AM";
    const hh = h % 12 || 12;
    return `${hh}:${String(m || 0).padStart(2, "0")} ${period}`;
  };
  
  // Realtime classes
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "classes"),
      (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("classes listener error:", err);
      }
    );

    return () => unsub();
  }, []);

  // Realtime expenses
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "expenses"),
      (snap) => {
        setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("expenses listener error:", err);
      }
    );

    return () => unsub();
  }, []);

useEffect(() => {
  const now = new Date();

  const normalizeDate = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue.toDate) return dateValue.toDate(); // Firestore Timestamp
    return new Date(dateValue); // String date
  };

  const f = (Array.isArray(expenses) ? expenses : []).filter((e) => {
    const d = normalizeDate(e.date);
    if (!d || isNaN(d)) return false;

    if (filter === "Today") {
      return d.toDateString() === now.toDateString();
    }

    if (filter === "This week") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return d >= weekStart;
    }

    if (filter === "Last month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return d >= start && d < end;
    }

    return true;
  });

  setFiltered(f);
  const sum = f.reduce((s, e) => s + (e.amount || 0), 0);
  setTotal(sum);
  setCo2(sum * 0.5);
}, [expenses, filter]);


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-5 md:p-10 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left Section */}
        <div>
          {/* Welcome Section */}
          <div className="bg-white w-full rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 mb-6">
            <div>
<h2 className="text-lg md:text-xl font-semibold text-gray-800">
  Welcome back, {profile.firstName || "User"}!
</h2>

              <p className="text-sm md:text-base text-gray-600">
                "Welcome to GreenMate – your companion for smarter classes, smarter spending, and a greener planet!
              </p>
            </div>
          </div>

          {/* Activity Chart + Estimated CO2 */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            {/* Activity Chart */}
            <div className="bg-[#1E1E3F] text-white rounded-2xl shadow p-6 flex-1">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Activity</h3>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-[#2A2A4F] text-sm rounded-lg px-3 py-1 mt-2 sm:mt-0 outline-none cursor-pointer"
                >
                  <option>Today</option>
                  <option>This week</option>
                  <option>Last month</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items:center justify-between gap-4">
                {/* Donut Chart */}
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto sm:mx-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" stroke="#2A2A4F" strokeWidth="4" fill="none" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      stroke="#A78BFA"
                      strokeWidth="4"
                      strokeDasharray="32 68"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      stroke="#60A5FA"
                      strokeWidth="4"
                      strokeDasharray="25 75"
                      strokeDashoffset="-32"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      stroke="#34D399"
                      strokeWidth="4"
                      strokeDasharray="17 83"
                      strokeDashoffset="-57"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      stroke="#FBBF24"
                      strokeWidth="4"
                      strokeDasharray="16 84"
                      strokeDashoffset="-74"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      stroke="#F472B6"
                      strokeWidth="4"
                      strokeDasharray="10 90"
                      strokeDashoffset="-90"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base sm:text-lg font-bold">${total.toFixed(2)}</span>
                    <span className="text-xs text-gray-300">Spent</span>
                  </div>
                </div>

                {/* Legend */}
                <ul className="text-xs sm:text-sm space-y-2">
                  {(() => {
                    const categoryTotals = (filtered || []).reduce((acc, e) => {
                      acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
                      return acc;
                    }, {});

                    const totalAmount = Object.values(categoryTotals).reduce(
                      (sum, val) => sum + val,
                      0
                    );

                    const colors = {
                      House: "bg-purple-400",
                      Food: "bg-blue-400",
                      Investing: "bg-green-400",
                      "Online Shop": "bg-yellow-400",
                      Beauty: "bg-pink-400",
                    };

                    return Object.entries(categoryTotals).map(([label, amt], idx) => {
                      const percent =
                        totalAmount > 0 ? ((amt / totalAmount) * 100).toFixed(0) + "%" : "0%";
                      return (
                        <li key={idx} className="flex justify-between w-32">
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 ${colors[label] || "bg-gray-400"} rounded-full`}
                            ></span>
                            {label}
                          </span>
                          <span>{percent}</span>
                        </li>
                      );
                    });
                  })()}
                </ul>
              </div>
            </div>

            {/* Estimated CO2 */}
            <div className="bg-white rounded-2xl shadow p-6 flex-1 flex flex-col justify-center items-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Estimated CO₂</h3>
              <p className="text-3xl md:text-4xl font-bold text-green-600 mb-1">{co2.toFixed(1)} kg</p>
              <p className="text-sm text-gray-500">This month’s total footprint</p>
            </div>
          </div>

          {/* Classes */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-700">Task</h3>
              <button
                onClick={() => navigate("/classroom")}
                className="text-sm text-blue-600 font-medium px-3 py-1 rounded-lg hover:bg-blue-100 hover:text-blue-700 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {visibleClasses.length === 0 ? (
                <p className="col-span-3 text-gray-500 text-center">No Task yet.</p>
              ) : (
                visibleClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="text-white rounded-2xl p-5 shadow relative transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    style={{ backgroundColor: cls.color || "#3B82F6" }}
                  >
                    <h4 className="text-lg font-semibold mb-2">{cls.classname}</h4>
                    <p className="text-sm">{(Array.isArray(cls.tasks) ? cls.tasks.length : 0)} Tasks</p>
                    <p className="text-xs opacity-90">Teacher: {cls.teacher}</p>
                    <p className="text-xs opacity-90">Schedule: {cls.schedule}</p>
                    <p className="text-xs opacity-90 mb-2">Time: {formatTime(cls.time)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div>
<div className="bg-white rounded-2xl shadow p-6">
  {/* Profile */}
  <div className="text-center mb-6">
    <img
      src={profile.avatar || "https://via.placeholder.com/100?text=User"}
      alt="Profile"
      className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-3 object-cover border"
    />
    <h3 className="font-semibold text-gray-800 text-lg">
      {profile.firstName} {profile.lastName}
    </h3>
    <p className="text-sm text-gray-500">{profile.email}</p>
    <button
      onClick={() => navigate("/settings")}
      className="bg-blue-600 text-white mt-3 px-5 py-2 rounded-xl hover:bg-blue-700 hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out"
    >
      Profile
    </button>
  </div>

            <hr className="my-6 border-gray-200" />

            {/* Calendar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-green-700">October 2025</h3>
                <span className="text-lg">📅</span>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm text-gray-700">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="font-medium text-gray-500">{d}</div>
                ))}
                {[...Array(31)].map((_, i) => (
                  <div
                    key={i}
                    className={`py-1 rounded-full ${
                      [7, 19].includes(i + 1)
                        ? "bg-blue-600 text-white font-bold"
                        : "hover:bg-blue-100"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
