import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  updateDoc, 
  doc,
} from "firebase/firestore";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ category: "House", amount: "", date: "" });
  const [filter, setFilter] = useState("Today");
  const [filtered, setFiltered] = useState([]);
  const [total, setTotal] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [co2, setCo2] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [editExpense, setEditExpense] = useState(null);

const handleSaveEdit = async (e) => {
  e.preventDefault();
  if (!editExpense) return;
  const ref = doc(db, "expenses", editExpense.id);
  await updateDoc(ref, {
    ...form,
    amount: Number(form.amount),
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
  setShowHistory(false); // closes modal when editing
};


  // 🔄 Real-time sync with Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
      setExpenses(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
    return unsub;
  }, []);

  // 🧮 Filter & calculate totals
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

    setFiltered(f);
    const sum = f.reduce((s, e) => s + Number(e.amount), 0);
    setTotal(sum);
    setCo2(sum * 0.5);

    const categorySums = f.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
    setCategoryTotals(categorySums);
  }, [expenses, filter]);

  // ➕ Add expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.date) {
      alert("Please fill out all fields.");
      return;
    }
    await addDoc(collection(db, "expenses"), {
      ...form,
      amount: Number(form.amount),
      timestamp: serverTimestamp(),
    });
    setForm({ category: "House", amount: "", date: "" });
  };

  // ❌ Delete expense
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "expenses", id));
  };

  // 📊 Category colors
  const categories = [
    { label: "House", color: "bg-purple-400" },
    { label: "Food", color: "bg-blue-400" },
    { label: "Investing", color: "bg-green-400" },
    { label: "Online Shop", color: "bg-yellow-400" },
    { label: "Beauty", color: "bg-pink-400" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />

      <main className="flex-1 p-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Expenses</h2>
          <button
            onClick={() => setShowHistory(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            View History
          </button>
        </div>

        {/* ➕ Add Expense Form */}
<form
  onSubmit={editExpense ? handleSaveEdit : handleSubmit}
  className="bg-white p-5 rounded-xl shadow-md mb-8 grid grid-cols-4 gap-4"
>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border rounded-lg p-2 w-full"
          >
            {categories.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="border rounded-lg p-2 w-full"
          />

          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border rounded-lg p-2 w-full"
          />

<button
  type="submit"
  className="bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition"
>
  {editExpense ? "Save Changes" : "Add Expense"}
</button>
        </form>

        {/* 🧭 Filters + Summary */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Activity</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border rounded-lg p-2 text-sm"
          >
            <option>Today</option>
            <option>This week</option>
            <option>Last month</option>
          </select>
        </div>

        {/* 💰 Total + CO₂ */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">{filter}</p>
            <h4 className="text-3xl font-bold text-gray-800">
              ${total.toFixed(2)}
            </h4>
            <p className="text-gray-500">Spent</p>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-green-600">
              {co2.toFixed(1)} kg CO₂
            </h4>
            <p className="text-gray-500 text-sm">Estimated footprint</p>
          </div>
        </div>

        {/* 📊 Category Breakdown */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            By Category
          </h3>
          <ul className="text-sm space-y-2">
            {categories.map((cat) => {
              const totalCat = categoryTotals[cat.label] || 0;
              const percent =
                total > 0 ? ((totalCat / total) * 100).toFixed(1) : 0;
              return (
                <li key={cat.label} className="flex justify-between w-64">
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 ${cat.color} rounded-full`}
                    ></span>
                    {cat.label}
                  </span>
                  <span>{percent}%</span>
                </li>
              );
            })}
          </ul>
        </div>

{/* 🧾 Expense History Modal */}
{showHistory && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white w-[600px] rounded-lg shadow-lg p-6 relative">
      <h3 className="text-xl font-semibold mb-4">Expense History</h3>
      <button
        onClick={() => setShowHistory(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
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
                className="flex justify-between items-center py-3"
              >
                <div>
                  <p className="font-medium text-gray-800">{exp.category}</p>
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
                    className="text-blue-500 text-sm hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="text-red-500 text-sm hover:underline"
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
      </main>
    </div>
  );
};

export default Expenses;
