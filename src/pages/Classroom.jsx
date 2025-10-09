import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const Classroom = () => {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    name: "",
    teacher: "",
    time: "",
    tasks: "",
    color: "#3B82F6",
  });
  const [editId, setEditId] = useState(null);

  // 🔄 Real-time sync from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "classes"), (snap) => {
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // 🟢 Add or update class
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.teacher || !form.time || !form.tasks) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      if (editId) {
        const ref = doc(db, "classes", editId);
        await updateDoc(ref, form);
        setEditId(null);
      } else {
        await addDoc(collection(db, "classes"), form);
      }
      setForm({ name: "", teacher: "", time: "", tasks: "", color: "#3B82F6" });
    } catch (err) {
      console.error("Error saving class:", err);
    }
  };

  // 📝 Edit
  const handleEdit = (cls) => {
    setEditId(cls.id);
    setForm({
      name: cls.name,
      teacher: cls.teacher,
      time: cls.time,
      tasks: cls.tasks,
      color: cls.color || "#3B82F6",
    });
  };

  // ❌ Delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      await deleteDoc(doc(db, "classes", id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />

      <main className="flex-1 p-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Classroom Manager
        </h2>

        {/* 🧾 Add/Edit Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-xl shadow-md mb-8 grid grid-cols-2 gap-4"
        >
          <input
            type="text"
            placeholder="Class Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="text"
            placeholder="Teacher"
            value={form.teacher}
            onChange={(e) => setForm({ ...form, teacher: e.target.value })}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="time"
            placeholder="Time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="number"
            placeholder="Tasks"
            value={form.tasks}
            onChange={(e) => setForm({ ...form, tasks: e.target.value })}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-full h-10 border rounded-lg cursor-pointer"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition"
          >
            {editId ? "Update Class" : "Add Class"}
          </button>
        </form>

        {/* 🏫 Classes Grid */}
        <div className="grid grid-cols-3 gap-4">
          {classes.length === 0 ? (
            <p className="col-span-3 text-gray-500 text-center">
              No classes yet.
            </p>
          ) : (
            classes.map((cls) => (
              <div
                key={cls.id}
                className="text-white rounded-2xl p-5 shadow relative"
                style={{ backgroundColor: cls.color }}
              >
                <h4 className="text-lg font-semibold mb-2">{cls.name}</h4>
                <p className="text-sm">{cls.tasks} Tasks</p>
                <p className="text-xs opacity-90">Teacher: {cls.teacher}</p>
                <p className="text-xs opacity-90 mb-4">Time: {cls.time}</p>

                {/* ✏️ Edit and Delete Buttons */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(cls)}
                    className="bg-white/20 text-white border border-white/30 px-3 py-1 rounded hover:bg-white/30 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="bg-white/20 text-white border border-white/30 px-3 py-1 rounded hover:bg-red-500 hover:border-red-500 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Classroom;
