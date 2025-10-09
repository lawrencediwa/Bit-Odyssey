import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "./Sidebar";


const Dashboard = () => {
const navigate = useNavigate();
const [expenses, setExpenses] = useState([]);
const [filter, setFilter] = useState("Today");
const [filtered, setFiltered] = useState([]);
const [total, setTotal] = useState(0);
const [co2, setCo2] = useState(0);
const [classes, setClasses] = useState([]);
const [user, setUser] = useState(null);

useEffect(() => {
  const ref = doc(db, "users", "currentUser");
  const unsub = onSnapshot(ref, (snap) => {
    if (snap.exists()) setUser(snap.data());
  });
  return unsub;
}, []);


useEffect(() => {
  const unsub = onSnapshot(collection(db, "classes"), (snap) => {
    setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
  return unsub;
}, []);

// 🔥 Realtime Firestore listener for expenses
useEffect(() => {
  const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
    setExpenses(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
  return unsub;
}, []);

// 🎯 Filter and calculate totals + CO₂ dynamically
useEffect(() => {
  const now = new Date();

  const f = expenses.filter((e) => {
    const d = new Date(e.date);

    if (filter === "Today") return d.toDateString() === now.toDateString();

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
  setCo2(sum * 0.5); // ⚙️ example conversion factor (you can tweak)
}, [expenses, filter]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-10 grid grid-cols-[2fr_1fr] gap-6">
        {/* Left Section */}
        <div>
          {/* Welcome Section */}
          <div className="bg-white w-full rounded-lg shadow-sm flex justify-between items-center px-8 py-6 mb-8">
            <div>
<h2 className="text-xl font-semibold text-gray-800">
  Welcome back, {user?.name || "User"}!
</h2>
              <p className="text-base text-gray-600">
                New French speaking classes are available.
              </p>
            </div>
          </div>

          {/* Activity Chart + Estimated CO2 */}
          <div className="flex gap-6 mb-6">
            {/* Activity Chart */}
            <div className="bg-[#1E1E3F] text-white rounded-2xl shadow p-6 w-1/2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Activity</h3>
                <select
  value={filter}
  onChange={(e) => setFilter(e.target.value)}
  className="bg-[#2A2A4F] text-sm rounded-lg px-3 py-1 outline-none cursor-pointer"
>
  <option>Today</option>
  <option>This week</option>
  <option>Last month</option>
</select>

              </div>

              <div className="flex items-center justify-between">
                {/* Donut Chart */}
                <div className="relative w-36 h-36">
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
                  <span className="text-lg font-bold">${total.toFixed(2)}</span>
                  <span className="text-xs text-gray-300">Spent</span>
                  </div>
                </div>

                {/* Legend */}
<ul className="text-sm space-y-2">
  {(() => {
    const categoryTotals = filtered.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
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
            <div className="bg-white rounded-2xl shadow p-6 w-1/2 flex flex-col justify-center items-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Estimated CO₂</h3>
              <p className="text-4xl font-bold text-green-600 mb-1">{co2.toFixed(1)} kg</p>
              <p className="text-sm text-gray-500">This month’s total footprint</p>
            </div>
          </div>

          {/* Classes */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-700">Classes</h3>
              <button
  onClick={() => navigate("/classroom")}
  className="text-sm text-blue-600 hover:underline"
>
  View All
</button>
            </div>
<div className="grid grid-cols-3 gap-4">
  {classes.length === 0 ? (
    <p className="col-span-3 text-gray-500 text-center">No classes yet.</p>
  ) : (
    classes.map((cls) => (
      <div
        key={cls.id}
        className="text-white rounded-2xl p-5 shadow"
        style={{ backgroundColor: cls.color }}
      >
        <h4 className="text-lg font-semibold mb-2">{cls.name}</h4>
        <p className="text-sm">{cls.tasks} Tasks</p>
        <p className="text-xs opacity-80">Teacher: {cls.teacher}</p>
        <p className="text-xs opacity-80">Time: {cls.time}</p>
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
            <div className="text-center mb-">
<img
  src={user?.photo || "https://via.placeholder.com/100?text=User"}
  alt="Profile"
  className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border"
/>
<h3 className="font-semibold text-gray-800 text-lg">
  {user?.name || "User"}
</h3>
<p className="text-sm text-gray-500">{user?.role || "Student"}</p>

              <button
  onClick={() => navigate("/settings")}
  className="bg-blue-600 text-white mt-3 px-5 py-2 rounded-xl hover:bg-blue-700 transition"
>
  Profile
</button>

            </div>

            <hr className="my-6 border-gray-200" />

            {/* Calendar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">December 2022</h3>
                <span className="text-lg">📅</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-sm text-gray-700">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="font-medium text-gray-500">{d}</div>
                ))}
                {[...Array(31)].map((_, i) => (
                  <div key={i} className={`py-1 rounded-full ${[7, 19].includes(i + 1) ? "bg-blue-600 text-white font-bold" : "hover:bg-blue-100"}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Reminders */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Reminders</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">🔔 Eng - Vocabulary test</li>
                <li className="flex items-center gap-2">📄 Eng - Essay</li>
                <li className="flex items-center gap-2">🔔 Eng - Speaking Class</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
