import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, doc, getDoc} from "firebase/firestore";
import { db, auth } from "../firebase";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";
import { query, where } from "firebase/firestore";
import { sendNotification } from "../utils/sendNotification";
import AnalyticsModal from "../components/AnalyticsModal"; // adjust path

const Dashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState("Today");
  const [filtered, setFiltered] = useState([]);
  const [total, setTotal] = useState(0);
  const [co2, setCo2] = useState(0);
  const [classes, setClasses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recError, setRecError] = useState(null);
  const [dashboardData, setDashboardData] = useState({});
  const [categories, setCategories] = useState([]);
  const [openAnalytics, setOpenAnalytics] = useState(false);


  
// Load categories from Firestore
useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const unsub = onSnapshot(
    collection(db, "categories"),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCategories(list);
    },
    (err) => console.error("categories listener error:", err)
  );

  return () => unsub();
}, []);
  const normalizeDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue.toDate) return dateValue.toDate();
  return new Date(dateValue); 
};

useEffect(() => {
  const loadUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));console.log("Current user:", auth.currentUser); 
    if (snap.exists()) {
      setDashboardData(snap.data().dashboard || {});
    }
  };
  loadUserData();
}, []);

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
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "classes"),
    where("userId", "==", user.uid) // 🔑 filter by user
  );

  const unsub = onSnapshot(q, (snap) => {
    setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.error("classes listener error:", err));

  return () => unsub();
}, []);

// Realtime expenses for current user only
useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "expenses"),
    where("userId", "==", user.uid) // 🔑 filter by user
  );

  const unsub = onSnapshot(q, (snap) => {
    setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.error("expenses listener error:", err));

  return () => unsub();
}, []);

useEffect(() => {
  const now = new Date();
  const f = expenses.filter((e) => {
    const d = normalizeDate(e.date);
    if (!d) return false;

    if (filter === "Today") return d.toDateString() === now.toDateString();
    if (filter === "This week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return d >= startOfWeek;
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

// Utility: pick a random message from an array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const fetchRecommendations = useCallback(() => {
  setLoadingRecs(true);
  setRecError(null);

  try {
    const recs = [];
    const today = new Date().toDateString();


    const dueToday = classes.filter(c => {
      const d = normalizeDate(c.schedule);
      return d && d.toDateString() === today;
    });

    if (dueToday.length >= 2) {
      recs.push(
        pick([
          "You have several deadlines today — tackle the quickest task first to gain momentum.",
          "Multiple tasks due today! Group similar ones to finish faster.",
          "Today is packed! Schedule 30-minute focus sessions to get everything done."
        ])
      );
    } else if (dueToday.length === 1) {
      recs.push(
        pick([
          `You have a task due today: ${dueToday[0].classname}. Start early to avoid rushing.`,
          `Don't forget your task for ${dueToday[0].classname} — finishing it now will ease your day.`,
          `One task due today! Prioritize ${dueToday[0].classname} to stay on track.`
        ])
      );
    }

    // RULE 2: Daily spending
    const totalSpentToday = expenses
      .filter(e => {
        const d = normalizeDate(e.date);
        return d && d.toDateString() === today;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    if (totalSpentToday > 500) {
      recs.push(
        pick([
          "Your spending today is a bit high — try a no-spend day tomorrow!",
          "You've spent quite a bit today. Consider reviewing your non-essential purchases.",
          "Today was costly — tracking small expenses can help you save more."
        ])
      );
    } else if (totalSpentToday === 0) {
      recs.push(
        pick([
          "Nice! No expenses recorded today — sustainable and budget-friendly!",
          "Zero spending today — you're doing great!",
          "No expenses yet today! Perfect opportunity to save even more."
        ])
      );
    }

    // RULE 3: Classes with many pending tasks
    const heavyClasses = classes.filter(c => Array.isArray(c.tasks) && c.tasks.length >= 3);

    heavyClasses.forEach(c => {
      recs.push(
        pick([
          `Your class "${c.classname}" has many tasks — try completing one small one today.`,
          `A lot of tasks in "${c.classname}" — break them down and finish one at a time.`,
          `"${c.classname}" is getting loaded. Organize your tasks to reduce stress.`
        ])
      );
    });

    // RULE 4: Monthly spending check
    const now = new Date();
    const currMonth = now.getMonth();

    const monthSpent = expenses
      .filter(e => {
        const d = normalizeDate(e.date);
        return d && d.getMonth() === currMonth;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    if (monthSpent > 3000) {
      recs.push(
        pick([
          "Your monthly spending is getting high — review your top categories.",
          "Consider reducing non-essentials this week to stay within budget.",
          "Your spending this month is above average — a mini-budget check might help."
        ])
      );
    }

    // If no recommendations created
    if (recs.length === 0) {
      recs.push(
        pick([
          "Everything looks balanced — keep up your sustainable routine!",
          "Nice! Your tasks and spending seem well-managed today.",
          "Good job staying organized! You're keeping everything on track."
        ])
      );
    }

    setRecommendations(recs);
  } catch (err) {
    setRecError("Failed to generate recommendations.");
  } finally {
    setLoadingRecs(false);
  }
}, [classes, expenses]);



// Debounce remains same
const debounceRef = useRef();
const debouncedFetchRecommendations = useCallback(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(fetchRecommendations, 600);
}, [fetchRecommendations]);

// Trigger recommendations whenever data updates
useEffect(() => {
  debouncedFetchRecommendations();
}, [classes, expenses, debouncedFetchRecommendations]);

const now = new Date();
const currentMonth = now.getMonth(); // 0-11
const currentYear = now.getFullYear();

const taskDates = useMemo(() => {
  return classes
    .filter(c => c.schedule)
    .map(c => normalizeDate(c.schedule))
    .filter(d => d && d.getMonth() === currentMonth && d.getFullYear() === currentYear)
    .map(d => d.getDate());
}, [classes, currentMonth, currentYear]);
const prevExpensesRef = useRef([]);

useEffect(() => {
  const prev = prevExpensesRef.current.map((e) => e.id);
  const newExpenses = expenses.filter((e) => !prev.includes(e.id));

  newExpenses.forEach((e) => {
    sendNotification("New Expense Added", `₱${e.amount} added to ${e.category}`);
  });

  prevExpensesRef.current = expenses;
}, [expenses]);

const prevClassesRef = useRef([]);

useEffect(() => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const isDueSoon = (cls) => {
    const d = normalizeDate(cls.schedule);
    if (!d) return false;
    return d.toDateString() === now.toDateString() || d.toDateString() === tomorrow.toDateString();
  };

  const prevIds = prevClassesRef.current.map((c) => c.id);
  const newDue = classes.filter((c) => !prevIds.includes(c.id) && isDueSoon(c));

  newDue.forEach((c) => {
    sendNotification(
      "Upcoming Task",
      `${c.classname} is due ${normalizeDate(c.schedule).toDateString()}`
    );
  });

  prevClassesRef.current = classes;
}, [classes]);

useEffect(() => {
  const todayStr = new Date().toDateString();
  const lastReminder = localStorage.getItem("dailyReminder");
  if (lastReminder !== todayStr) {
    sendNotification("Daily Reminder", "Don't forget to log your expenses and check tasks!");
    localStorage.setItem("dailyReminder", todayStr);
  }
}, []);


 return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col lg:flex-row min-h-screen bg-gray-100"
  >
    {/* Sidebar */}
    <div className="w-full lg:w-64 lg:h-screen lg:sticky top-0 bg-white shadow z-10">
    <Sidebar />
</div>
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
              "Welcome to GreenMate – your companion for smarter classes, smarter spending, and a greener planet!"
            </p>
          </div>
        </div>

          {/* Activity Chart + Estimated CO2 */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            {/* Activity Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex-1">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Activity</h3>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-gray-100 text-sm rounded-lg px-3 py-1 mt-2 sm:mt-0 outline-none cursor-pointer"
                >
                  <option>Today</option>
                  <option>This week</option>
                  <option>Last month</option>
                </select>
              </div>

{/* Donut Chart + Legend */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
{/* Donut Chart */}
<div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto sm:mx-0">
  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
    {/* Background Circle */}
    <circle
      cx="18"
      cy="18"
      r="16"
      stroke="#E5E7EB"
      strokeWidth="4"
      fill="none"
    />

    {/* Compute totals and draw slices */}
    {(() => {
      const categoryTotals = filtered.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
        return acc;
      }, {});

      const totalAmount = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

      let offsetAcc = 0;

      return Object.entries(categoryTotals).map(([label, value]) => {
        const percent = totalAmount > 0 ? (value / totalAmount) * 100 : 0;
        const categoryObj = categories.find(c => c.label === label);
        const color = categoryObj?.color || "#60A5FA";

        const slice = (
          <circle
            key={label}
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${percent} ${100 - percent}`}
            strokeDashoffset={100 - offsetAcc}
          />
        );

        offsetAcc += percent;
        return slice;
      });
    })()}
  </svg>

    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-base sm:text-lg font-bold text-gray-800">
        ₱{total.toFixed(2)}
      </span>
      <span className="text-xs text-gray-500">Spent</span>
    </div>
  </div>

  {/* Legend */}
  <ul className="text-xs sm:text-sm space-y-2">
    {(() => {
      const categoryTotals = filtered.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
        return acc;
      }, {});

      const totalAmount = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

      return Object.entries(categoryTotals).map(([label, amt], idx) => {
        const percent = totalAmount > 0 ? ((amt / totalAmount) * 100).toFixed(0) + "%" : "0%";
const color = categories.find(e => e.category === label)?.color
            || categories.find(c => c.label === label)?.color
            || "#60A5FA";


        return (
          <li key={idx} className="flex justify-between w-32">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
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
  <button
  onClick={() => setOpenAnalytics(true)}
  className="bg-green-600 text-white mt-3 px-5 py-2 rounded-xl hover:bg-green-700 hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-300 ease-in-out"
>
  View Analytics
</button>


            <hr className="my-6 border-gray-200" />
            {/* Calendar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-green-700">December 2025</h3>
                <span className="text-lg">📅</span>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm text-gray-700">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="font-medium text-gray-500">{d}</div>
                ))}
{[...Array(31)].map((_, i) => {
  const day = i + 1;
  const hasTask = taskDates.includes(day);

  return (
    <div
      key={i}
      className={`py-1 rounded-full cursor-pointer ${
        hasTask ? "bg-green-600 text-white font-bold" : "hover:bg-green-100"
      }`}
    >
      {day}
    </div>
  );
})}
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="bg-white p-4 rounded-xl shadow-md mb-6">
              <h3 className="text-lg font-medium mb-2">Smart Recommendations</h3>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-500">Personalized suggestions based on your tasks and expenses.</div>
                <div>
<button
  onClick={fetchRecommendations}
  disabled={loadingRecs}
  className={`text-sm px-3 py-1 rounded ${
    loadingRecs
      ? "bg-gray-200 text-gray-500"
      : "bg-green-600 text-white hover:bg-green-700"
  }`}
>
  {loadingRecs ? "Refreshing..." : "Refresh"}
</button>

                </div>  
              </div>

              {recError ? (
                <div className="text-sm text-red-500 mb-2">{recError}</div>
              ) : null}

<div className="text-sm text-gray-600 mt-2 space-y-1">
  {recommendations.length > 0 ? (
    recommendations.map((rec, i) => <div key={i}>• {rec}</div>)
  ) : (
    "Click refresh to get a smart recommendation!"
  )}
</div>

            </div>
          </div>
        </div>
      </main>
      {openAnalytics && (
  <AnalyticsModal
    open={openAnalytics}
    setOpen={setOpenAnalytics}
    expenses={expenses}
    categories={categories}
    profile={profile}
    classes={classes}
  />
)}
          </motion.div>
  );
};
  

export default Dashboard;
