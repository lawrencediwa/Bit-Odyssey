  import React, { useState, useEffect } from "react";
  import Sidebar from "./Sidebar";
  import { db, auth} from "../firebase";
  import { sendNotification } from "../utils/sendNotification";
import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";

  const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [form, setForm] = useState({ category: "House", amount: "", date: "" });
    const [filter, setFilter] = useState("Today");
    const [total, setTotal] = useState(0);
    const [categoryTotals, setCategoryTotals] = useState({});
    const [co2, setCo2] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [editExpense, setEditExpense] = useState(null); 
    // Monthly budget stored locally; 0 means not set
    const [monthlyBudget, setMonthlyBudget] = useState(() => {
      try {
        const v = localStorage.getItem("monthlyBudget");
        return v ? Number(v) : 0;
      } catch (e) {
        return 0;
      }
    });
    const [remaining, setRemaining] = useState(0);
    // temporary input for budget so typing doesn't immediately commit
    const [tempBudget, setTempBudget] = useState(() => (monthlyBudget > 0 ? String(monthlyBudget) : ""));

    // transient flashes for small animations when numbers update
    const [totalFlash, setTotalFlash] = useState(false);
    const [co2Flash, setCo2Flash] = useState(false);
    const [categoryFlash, setCategoryFlash] = useState(false);
    const firstTotalsRef = React.useRef(true);
    // Onboarding modal shown once (persisted). It appears when there is no budget and no expenses.
    const [showOnboarding, setShowOnboarding] = useState(false);
    useEffect(() => {
  if (total >= monthlyBudget && monthlyBudget > 0) {
    sendNotification("Budget Alert", "You have reached or exceeded your monthly budget!");
  }
}, [total, monthlyBudget]);
useEffect(() => {
  if (total >= monthlyBudget && monthlyBudget > 0) {
    sendNotification("Budget Alert", "You have reached or exceeded your monthly budget!");
  }
}, [total, monthlyBudget]);
useEffect(() => {
  const now = new Date();
  const lastReminder = localStorage.getItem("dailyReminder");
  const todayStr = now.toDateString();

  if (lastReminder !== todayStr) {
    sendNotification("Daily Reminder", "Don't forget to log your expenses today!");
    localStorage.setItem("dailyReminder", todayStr);
  }
}, [expenses]);

useEffect(() => {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("✅ Test Notification", { body: "Notifications are working!" });
      }
    });
  }
}, []);


    useEffect(() => {
  if (!auth.currentUser) return;

  const q = query(
    collection(db, "expenses"),
    where("userId", "==", auth.currentUser.uid)
  );

  const unsub = onSnapshot(q, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "added") {
        const e = change.doc.data();
        sendNotification(
          "New Expense Added",
          `₱${e.amount} added to ${e.category}`
        );
      }
    });
  });

  return () => unsub();
}, []);

useEffect(() => {
  const unsubAuth = auth.onAuthStateChanged(user => {
    if (!user) {
      setExpenses([]);
      return;
    }

    const q = query(
      collection(db, "expenses"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      setExpenses(list);
    });

    return () => unsub();
  });

  return () => unsubAuth();
}, []);



    // ✅ FILTER + TOTALS CALC
    useEffect(() => {
      const now = new Date();
      const f = expenses.filter((e) => {
        const d = new Date(e.date);
        if (filter === "Today") return d.toDateString() === now.toDateString();
        if (filter === "This week") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          return d >= startOfWeek;
        }
        if (filter === "Last month") {
          return (
            d >= new Date(now.getFullYear(), now.getMonth() - 1, 1) &&
            d < new Date(now.getFullYear(), now.getMonth(), 1)
          );
        }
        return true;
      });

      const sum = f.reduce((s, e) => s + Number(e.amount), 0);
      // update totals
      // flash animation on subsequent updates (skip first load)
      if (firstTotalsRef.current) {
        setTotal(sum);
        setCo2(sum * 0.5);
        firstTotalsRef.current = false;
      } else {
        setTotal(sum);
        setCo2(sum * 0.5);
        setTotalFlash(true);
        setCo2Flash(true);
        setCategoryFlash(true);
        setTimeout(() => setTotalFlash(false), 800);
        setTimeout(() => setCo2Flash(false), 900);
        setTimeout(() => setCategoryFlash(false), 1000);
      }

      const categorySums = f.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      }, {});
      setCategoryTotals(categorySums);
    }, [expenses, filter]);

    // update remaining when total or monthlyBudget change
    useEffect(() => {
      setRemaining((monthlyBudget || 0) - (total || 0));
      try {
        localStorage.setItem("monthlyBudget", String(monthlyBudget || 0));
      } catch (e) {}
    }, [monthlyBudget, total]);

    // formatting helpers used in the UI
    const fmtCurrency = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const usedPercent = monthlyBudget > 0 ? ((total / monthlyBudget) * 100) : 0;

    // show onboarding if user has not seen it yet and no budget/expenses
    useEffect(() => {
      try {
        const seen = localStorage.getItem("seenExpensesOnboarding");
        if (!seen && monthlyBudget <= 0 && (!expenses || expenses.length === 0)) {
          setShowOnboarding(true);
        }
      } catch (e) {}
    }, [monthlyBudget, expenses]);

    // keep tempBudget sync when monthlyBudget changes (so Reset clears input)
    useEffect(() => {
      setTempBudget(monthlyBudget > 0 ? String(monthlyBudget) : "");
    }, [monthlyBudget]);

    // ✅ ADD EXPENSE (writes directly to Firestore)
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!form.amount || !form.date) {
        alert("Please fill out all fields.");
        return;
      }

await addDoc(collection(db, "expenses"), {
  ...form,
  amount: Number(form.amount),
  date: form.date,
  userId: auth.currentUser.uid,   // <-- ADD THIS
  timestamp: serverTimestamp(),
});

      setForm({ category: "House", amount: "", date: "" });
    };

    // ✅ EDIT EXPENSE (Firestore only)
    const handleSaveEdit = async (e) => {
      e.preventDefault();
      if (!editExpense) return;

      const ref = doc(db, "expenses", editExpense.id);
await updateDoc(ref, {
  ...form,
  amount: Number(form.amount),
  userId: auth.currentUser.uid, // ensure it still belongs to user
  timestamp: serverTimestamp(),
});

      setEditExpense(null);
      setForm({ category: "House", amount: "", date: "" });
    };

    const handleEdit = (expense) => {
      setEditExpense(expense);
      setForm({
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
      });
      setShowHistory(false);
    };

    // ✅ DELETE FROM FIRESTORE
    const handleDelete = async (id) => {
      await deleteDoc(doc(db, "expenses", id));
    };

    // ✅ CATEGORY STATE (still local because it’s UI preference, not data)
    const [categories, setCategories] = useState([
      { label: "House", color: "#A78BFA" },
      { label: "Food", color: "#60A5FA" },
      { label: "Investing", color: "#34D399" },
      { label: "Online Shop", color: "#FBBF24" },
      { label: "Beauty", color: "#F472B6" },
    ]);
    const [editingCategory, setEditingCategory] = useState(null);
    const [catForm, setCatForm] = useState({ label: "", color: "#9CA3AF" });

    const startEditCategory = (cat) => {
      setEditingCategory(cat.label);
      setCatForm({ label: cat.label, color: cat.color });
    };

    const saveEditedCategory = () => {
      if (!editingCategory) return;
      if (!catForm.label.trim()) {
        alert("Category label cannot be empty.");
        return;
      }
      // prevent duplicate label (except renaming to same)
      if (
        categories.some(
          (c) => c.label.toLowerCase() === catForm.label.trim().toLowerCase() && c.label !== editingCategory
        )
      ) {
        alert("A category with that label already exists.");
        return;
      }

      setCategories((prev) =>
        prev.map((c) =>
          c.label === editingCategory ? { ...c, label: catForm.label.trim(), color: catForm.color } : c
        )
      );
      // Update expenses that used the old category label
      setExpenses((prev) =>
        prev.map((e) => (e.category === editingCategory ? { ...e, category: catForm.label.trim() } : e))
      );

      setEditingCategory(null);
      setCatForm({ label: "", color: "#9CA3AF" });
    };

    const cancelEditCategory = () => {
      setEditingCategory(null);
      setCatForm({ label: "", color: "#9CA3AF" });
    };

    const deleteCategory = (label) => {
      if (!label) return;
      const ok = window.confirm(
        `Delete category "${label}"?\nExpenses in this category will be moved to "Uncategorized".`
      );
      if (!ok) return;

      // remove category
      setCategories((prev) => {
        const next = prev.filter((c) => c.label !== label);
        if (!next.some((c) => c.label === "Uncategorized")) {
          next.push({ label: "Uncategorized", color: "#9CA3AF" });
        }
        return next;
      });

      // move expenses to "Uncategorized"
      setExpenses((prev) =>
        prev.map((e) => (e.category === label ? { ...e, category: "Uncategorized" } : e))
      );

      if (editingCategory === label) {
        setEditingCategory(null);
        setCatForm({ label: "", color: "#9CA3AF" });
      }
    };

    const addCategory = () => {
      if (!catForm.label.trim()) {
        alert("Enter a label for the new category.");
        return;
      }
      if (categories.some((c) => c.label.toLowerCase() === catForm.label.trim().toLowerCase())) {
        alert("Category already exists.");
        return;
      }
      const newCat = { label: catForm.label.trim(), color: catForm.color || "#9CA3AF" };
      setCategories((prev) => [newCat, ...prev]);
      setCatForm({ label: "", color: "#9CA3AF" });
    };
    // --- CHANGES END ---

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 md:p-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h2 className="text-2xl font-semibold text-gray-800">Expenses</h2>
            <button
              onClick={() => setShowHistory(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg 
                        hover:bg-green-700 hover:scale-105 hover:shadow-md 
                        active:scale-95 transition-all duration-300 ease-in-out"
            >
              View History
            </button>
          </div>

          {/* Upper section: Budget Goals, Analytics, Budget Limits, CO2 Limit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-medium mb-2">Step 1 — Set Monthly Budget</h3>
              {monthlyBudget > 0 ? (
                <>
                  <p className={`text-base text-gray-600 ${totalFlash ? 'animate-pulse' : ''}`}>Monthly Budget</p>
                  <h4 className="text-4xl font-extrabold text-gray-800 mt-1">₱{fmtCurrency(monthlyBudget)}</h4>

                  <p className="text-base text-gray-600 mt-4">Remaining</p>
                  <h4 className={`text-2xl md:text-3xl font-semibold mt-1 ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₱{fmtCurrency(remaining)}
                    <span title="Used% = (Total expenses / Monthly budget) × 100" className="ml-3 text-sm text-gray-400">🛈</span>
                  </h4>

                  <p className="text-base text-gray-500 mt-3">Used: <span className="font-medium">{usedPercent.toFixed(1)}%</span></p>
                  <button
                    onClick={() => {
                      setMonthlyBudget(0);
                      setTempBudget("");
                      try { localStorage.removeItem('monthlyBudget'); } catch(e) {}
                    }}
                    className="mt-3 text-sm text-red-500 hover:underline"
                  >
                    Reset Budget
                  </button>
                </>
              ) : (
                <div>
                  <p className="text-base text-gray-500 mb-2">Enter your monthly budget to begin tracking.</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Monthly budget (e.g. 1500)"
                      className="border rounded-lg p-2 w-full"
                      value={tempBudget}
                      onChange={(e) => setTempBudget(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = Number((tempBudget || "").trim() || 0);
                          setMonthlyBudget(v);
                          try {
                            localStorage.setItem("monthlyBudget", String(v));
                          } catch (err) {}
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = Number((tempBudget || "").trim() || 0);
                        setMonthlyBudget(v);
                        try {
                          localStorage.setItem("monthlyBudget", String(v));
                        } catch (err) {}
                      }}
                      className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={`bg-white p-6 rounded-xl shadow-md ${monthlyBudget <= 0 ? 'opacity-40 pointer-events-none' : ''}`}>
              <h3 className="text-lg font-medium mb-2">Step 3 — Analytics</h3>
              <p className={`text-base text-gray-600 ${co2Flash ? 'animate-pulse' : ''}`}>
                Estimated footprint
              </p>
              <h4 className={`text-4xl font-extrabold mt-2 ${co2Flash ? 'animate-pulse' : ''}`}>{Number(co2).toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})} <span className="text-lg font-normal text-gray-600">kg</span>
                <span title="CO₂ footprint = Environmental impact estimate based on your spending" className="ml-2 text-sm text-gray-400">🛈</span>
              </h4>

              {/* Used percent progress bar (shows when budget is set) */}
              {monthlyBudget > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2 text-base text-gray-600">
                    <span>Budget used</span>
                    <span className="font-semibold">{usedPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 rounded overflow-hidden">
                    <div
                      className={`h-3 rounded ${usedPercent > 100 ? 'bg-red-600' : usedPercent > 75 ? 'bg-yellow-500' : 'bg-green-600'}`}
                      style={{ width: `${Math.min(100, Math.max(0, usedPercent))}%` }}
                    />
                  </div>
                </div>
              )}

              {monthlyBudget <= 0 ? (
                <p className="text-xs text-gray-400 mt-2">Set a monthly budget to enable analytics.</p>
              ) : total === 0 ? (
                <p className="text-xs text-gray-400 mt-2">Once you record expenses, we’ll calculate your footprint.</p>
              ) : null}
            </div>

            <div className={`bg-white p-6 rounded-xl shadow-md ${monthlyBudget <= 0 ? 'opacity-40 pointer-events-none' : ''}`}>
              <h3 className="text-lg font-medium mb-2">Budget & CO2 Limits</h3>

              {/* Budget summary */}
              {monthlyBudget > 0 ? (
                <>
                  <p className="text-base text-gray-600">Monthly Budget</p>
                  <h4 className="text-3xl font-bold mt-1">₱{fmtCurrency(monthlyBudget)}</h4>

                  <div className="mt-3">
                    <p className="text-base text-gray-600">Remaining</p>
                    <h4 className={`text-2xl font-semibold mt-1 ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>₱{fmtCurrency(remaining)}</h4>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1 text-base text-gray-600">
                      <span>Budget used</span>
                      <span className="font-semibold">{usedPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
                      <div
                        className={`h-2 rounded ${usedPercent > 100 ? 'bg-red-600' : usedPercent > 75 ? 'bg-yellow-500' : 'bg-green-600'}`}
                        style={{ width: `${Math.min(100, Math.max(0, usedPercent))}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Set a monthly budget to see limits and CO₂ calculations here.</p>
              )}

              <hr className="my-3" />

              <p className="text-base text-gray-600">Category Totals</p>
              <ul className="text-base text-gray-600 mt-2">
                {Object.entries(categoryTotals).length === 0 ? (
                  <li className="text-gray-500">Start tracking spending in categories — add new categories anytime!</li>
                ) : (
                  Object.entries(categoryTotals).map(([category, amount]) => (
                    <li key={category} className={`flex justify-between ${categoryFlash ? 'transition-all duration-500' : ''}`}>
                      <span>{category}</span>
                      <span className="font-medium">₱{fmtCurrency(amount)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Step 2 — Add Expense (hint) */}
          <div className="mb-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-300 p-3 text-sm text-yellow-700 rounded">
              <strong>Step 2 — Add an Expense:</strong> Record your spending here — choose a category, amount, and date.
            </div>
          </div>

          {/* Add Expense Form */}
          <form
            onSubmit={editExpense ? handleSaveEdit : handleSubmit}
            className="bg-white p-5 rounded-xl shadow-md mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
          >
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border rounded-lg p-2 w-full transition-all duration-200 
                        focus:ring-2 focus:ring-blue-400 focus:outline-none"
              title="Category (where you spent)"
              aria-label="Category (where you spent)"
            >
              {categories.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Amount (how much did you spend?)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="border rounded-lg p-2 w-full transition-all duration-200 
                        focus:ring-2 focus:ring-blue-400 focus:outline-none"
              title="Amount (how much did you spend?)"
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border rounded-lg p-2 w-full transition-all duration-200 
                        focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />

            <button
              type="submit"
              className="bg-green-600 text-white rounded-lg py-2 
                        hover:bg-green-700 hover:scale-105 hover:shadow-md 
                        active:scale-95 transition-all duration-300 ease-in-out"
              title="Record this expense — updates budget and CO₂"
            >
              {editExpense ? "Save Changes" : "Record Expense"}
            </button>
          </form>

          {/* Filters + Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h3 className="text-lg font-semibold text-gray-800">Activity</h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border rounded-lg p-2 text-sm 
                        transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option>Today</option>
              <option>This week</option>
              <option>Last month</option>
            </select>
          </div>

          {/* Activity empty state guidance */}
          {expenses.length === 0 && (
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 text-center text-gray-600">
              <p className="font-medium">No expenses recorded yet.</p>
              <p className="text-sm">Try adding one using the form above!</p>
            </div>
          )}

          {/* Totals */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">{filter}</p>
              <h4 className={`text-3xl font-bold text-gray-800 ${totalFlash ? 'scale-105 text-green-700 transition-transform duration-300' : ''}`}>
                ₱{total.toFixed(2)}
              </h4>
              <p className="text-gray-500">Spent</p>
            </div>
            <div>
              <h4 className={`text-2xl font-bold text-green-600 ${co2Flash ? 'animate-pulse' : ''}`}>
                {co2.toFixed(1)} kg CO₂
              </h4>
              <p className="text-gray-500 text-sm">Estimated footprint</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              By Category
            </h3>
            <ul className="text-sm space-y-2">
              {categories.map((cat) => {
                const totalCat = categoryTotals[cat.label] || 0;
                const percent =
                  total > 0 ? ((totalCat / total) * 100).toFixed(1) : 0;
                const isEditing = editingCategory === cat.label;
                return (
                  <li
                    key={cat.label}
                    className="flex flex-col sm:flex-row justify-between w-full sm:w-64 hover:bg-gray-50 p-1 rounded-md transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      {isEditing ? (
                        <input
                          value={catForm.label}
                          onChange={(e) => setCatForm({ ...catForm, label: e.target.value })}
                          className="border p-1 rounded text-sm"
                        />
                      ) : (
                        <span>{cat.label}</span>
                      )
                      }
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="mr-2">{percent}%</span>

                      {isEditing ? (
                        <>
                          <input
                            type="color"
                            value={catForm.color}
                            onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                            className="w-10 h-8 p-0 border rounded"
                            title="Choose color"
                          />
                          <button
                            onClick={saveEditedCategory}
                            className="text-green-600 text-sm hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => deleteCategory(cat.label)}
                            className="text-red-500 text-sm hover:underline"
                          >
                            Delete
                          </button>
                          <button
                            onClick={cancelEditCategory}
                            className="text-gray-500 text-sm hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditCategory(cat)}
                            className="text-blue-500 text-sm hover:text-blue-700 hover:scale-105 active:scale-95 transition-all duration-200"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Add new category */}
            <div className="mt-4 border-t pt-4 flex flex-col sm:flex-row items-start gap-3">
              <div className="flex items-center w-full sm:w-1/3">
                <input
                  placeholder="New category label"
                  value={catForm.label}
                  onChange={(e) => setCatForm({ ...catForm, label: e.target.value })}
                  className="border rounded-l-lg p-2 w-full"
                />
                <input
                  type="color"
                  value={catForm.color}
                  onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                  className="w-12 h-10 p-0 border rounded-r-lg border-l-0"
                  title="Pick category color"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addCategory}
                  className="bg-green-600 text-white rounded-lg py-2 px-4 hover:bg-green-700"
                >
                  Add Category
                </button>
                <button
                  onClick={() => setCatForm({ label: "", color: "#9CA3AF" })}
                  className="bg-gray-200 text-gray-700 rounded-lg py-2 px-4 hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Expense History Modal */}
          {showHistory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative animate-fadeIn">
                <h3 className="text-xl font-semibold mb-4">Expense History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="absolute top-3 right-3 text-gray-500 
                            hover:text-gray-800 hover:scale-110 
                            active:scale-95 transition-all duration-200"
                >
                  ✖
                </button>

                {expenses.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">
                    No expenses recorded yet.
                  </p>
                ) : (
                  <ul className="divide-y max-h-[400px] overflow-y-auto">
                    {expenses
                      .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
                      .map((exp) => (
                        <li
                          key={exp.id}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 gap-2 hover:bg-gray-50 rounded-md transition-all"
                        >
                          <div>
                            <p className="font-medium text-gray-800">
                              {exp.category}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(exp.date).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-semibold text-blue-600">
                              ${exp.amount.toFixed(2)}
                            </p>
                            <button
                              onClick={() => handleEdit(exp)}
                              className="text-blue-500 text-sm 
                                        hover:text-blue-700 hover:scale-105 
                                        active:scale-95 transition-all duration-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="text-red-500 text-sm 
                                        hover:text-red-700 hover:scale-105 
                                        active:scale-95 transition-all duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Simple Onboarding Overlay (step-by-step) */}
          {showOnboarding && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => { setShowOnboarding(false); try{ localStorage.setItem('seenExpensesOnboarding','true')}catch(e){} }} />
              <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6 z-10">
                <h3 className="text-xl font-semibold mb-3">Welcome to Expenses</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li><strong>Set budget:</strong> Enter your monthly budget to enable analytics.</li>
                  <li><strong>Add expense:</strong> Record category, amount, and date using the form.</li>
                  <li><strong>View results:</strong> Watch remaining budget, CO₂, and category percentages update.</li>
                </ol>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => { setShowOnboarding(false); try{ localStorage.setItem('seenExpensesOnboarding','true')}catch(e){} }} className="px-3 py-1 rounded bg-green-600 text-white">Got it</button>
                  <button onClick={() => { setShowOnboarding(false); try{ localStorage.setItem('seenExpensesOnboarding','true')}catch(e){} }} className="px-3 py-1 rounded bg-gray-100">Dismiss</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  export default Expenses;
