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

  // ✅ REALTIME FIRESTORE LISTENER (no local updates anymore)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "expenses"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setExpenses(list);
      },
      (err) => console.error(err)
    );
    return () => unsub();
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
            className="border rounded-lg p-2 w-full transition-all duration-200 
                       focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
          >
            {editExpense ? "Save Changes" : "Add Expense"}
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

        {/* Totals */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
      </main>
    </div>
  );
};

export default Expenses;
