import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const COLOR_OPTIONS = [
  "#3B82F6", // blue
  "#A78BFA", // purple
  "#60A5FA", // light blue
  "#34D399", // green
  "#FBBF24", // yellow
  "#F472B6", // pink
  "#F87171", // red
  "#94A3B8", // slate
];

const Classroom = () => {
  const calendarRef = useRef(null);

  // Firestore-backed state
  const [classes, setClasses] = useState([]);

  // Form state (matches your chosen schema)
  const [form, setForm] = useState({
    classname: "",
    teacher: "",
    schedule: "",
    time: "",
    tasks: [], // array of { name, done }
    status: "Ongoing", // or "Completed"
    color: COLOR_OPTIONS[0],
  });
  const [taskInput, setTaskInput] = useState(""); // single task text field
  const [editId, setEditId] = useState(null);

  // Local edits for tasks per class card (not saved until Save Tasks clicked)
  // Map: { [classId]: [{name, done}, ...] }
  const [taskEdits, setTaskEdits] = useState({});

  // view & filter state
  const [calendarView, setCalendarView] = useState("dayGridMonth");
  const [statusFilter] = useState("all");

  // helpers
  const formatTime = (time) => {
    if (!time) return "";
    return time;
  };

const [eventModalOpen, setEventModalOpen] = useState(false);
const [eventModalTitle, setEventModalTitle] = useState("");
const [eventModalTasks, setEventModalTasks] = useState([]);

// --- replace your existing filteredEvents with this version ---
const filteredEvents = classes
  .filter((c) => statusFilter === "all" || c.status === statusFilter)
  .flatMap((cls) => {
    // class event (same as before)
    const classEvent = {
      title: cls.classname,
      start:
        cls.schedule && /^\d{4}-\d{2}-\d{2}$/.test(cls.schedule)
          ? cls.time
            ? `${cls.schedule}T${cls.time}`
            : cls.schedule
          : null,
      color: cls.status === "Completed" ? "#10B981" : cls.color || COLOR_OPTIONS[0],
      extendedProps: { type: "class", status: cls.status, teacher: cls.teacher },
      id: `class-${cls.id}`,
    };

    // tasks grouped into one event (only if there are tasks)
    const tasks = Array.isArray(cls.tasks) ? cls.tasks : [];
    const taskEvent =
      tasks.length > 0
        ? {
            title: `${cls.classname} (${tasks.length} Task${tasks.length > 1 ? "s" : ""})`,
            start:
              cls.schedule && /^\d{4}-\d{2}-\d{2}$/.test(cls.schedule)
                ? cls.time
                  ? `${cls.schedule}T${cls.time}`
                  : cls.schedule
                : null,
            color: "#374151", // darker neutral color for tasks
            extendedProps: { type: "tasks", tasks, classname: cls.classname, classId: cls.id },
            id: `tasks-${cls.id}`,
          }
        : null;

    // return both (taskEvent may be null)
    return taskEvent ? [classEvent, taskEvent] : [classEvent];
  });

  // ---------- Firestore: realtime listener for classes ----------
  useEffect(() => {
    const q = collection(db, "classes");
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setClasses(docs);

        // initialize any missing tasks into taskEdits map
        const initialEdits = {};
        docs.forEach((c) => {
          initialEdits[c.id] = Array.isArray(c.tasks) ? c.tasks.map((t) => ({ ...t })) : [];
        });
        setTaskEdits((prev) => ({ ...initialEdits, ...prev }));
      },
      (err) => {
        console.error("Failed to listen to classes:", err);
      }
    );

    return () => unsub();
  }, []);

  // ---------- Add / Update / Delete / Status / Tasks handlers ----------
  const resetForm = () => {
    setForm({
      classname: "",
      teacher: "",
      schedule: "",
      time: "",
      tasks: [],
      status: "Ongoing",
      color: COLOR_OPTIONS[0],
    });
    setTaskInput("");
    setEditId(null);
  };

  // Form-local task helpers (for the add/edit form)
  const addTaskToForm = () => {
    const name = taskInput.trim();
    if (!name) return;
    setForm((f) => ({ ...f, tasks: [...(Array.isArray(f.tasks) ? f.tasks : []), { name, done: false }] }));
    setTaskInput("");
  };

  const removeTaskFromForm = (index) => {
    setForm((f) => ({ ...f, tasks: (f.tasks || []).filter((_, i) => i !== index) }));
  };

  const toggleTaskDoneInForm = (index) => {
    setForm((f) => ({
      ...f,
      tasks: (f.tasks || []).map((t, i) => (i === index ? { ...t, done: !t.done } : t)),
    }));
  };

  // submit: either addDoc or updateDoc
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classname || !form.teacher || !form.schedule) {
      alert("Please fill classname, teacher and schedule.");
      return;
    }

    try {
      if (editId) {
        // update existing
        const docRef = doc(db, "classes", editId);
        await updateDoc(docRef, {
          classname: form.classname,
          teacher: form.teacher,
          schedule: form.schedule,
          time: form.time,
          tasks: Array.isArray(form.tasks) ? form.tasks : [],
          status: form.status || "Ongoing",
          color: form.color || COLOR_OPTIONS[0],
        });
      } else {
        // add new
        await addDoc(collection(db, "classes"), {
          classname: form.classname,
          teacher: form.teacher,
          schedule: form.schedule,
          time: form.time,
          tasks: Array.isArray(form.tasks) ? form.tasks : [],
          status: form.status || "Ongoing",
          color: form.color || COLOR_OPTIONS[0],
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save class:", err);
      alert("Failed to save class. Check console for details.");
    }
  };

  // when clicking Edit on a class, load into form (form edits saved by Submit)
  const handleEdit = (cls) => {
    setEditId(cls.id);
    setForm({
      classname: cls.classname || "",
      teacher: cls.teacher || "",
      schedule: cls.schedule || "",
      time: cls.time || "",
      tasks: Array.isArray(cls.tasks) ? cls.tasks.map((t) => ({ ...t })) : [],
      status: cls.status || "Ongoing",
      color: cls.color || COLOR_OPTIONS[0],
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      await deleteDoc(doc(db, "classes", id));
    } catch (err) {
      console.error("Failed to delete class:", err);
      alert("Failed to delete class.");
    }
  };

  // advance status: Ongoing -> Completed (then stop)
  const advanceStatus = async (cls) => {
    if (cls.status === "Completed") return;
    try {
      await updateDoc(doc(db, "classes", cls.id), { status: "Completed" });
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status.");
    }
  };

  // Task operations on the card: modify local taskEdits only until Save is clicked
  const ensureTaskEditsFor = (classId) => {
    setTaskEdits((prev) => {
      if (prev[classId]) return prev;
      const cls = classes.find((c) => c.id === classId) || {};
      return { ...prev, [classId]: Array.isArray(cls.tasks) ? cls.tasks.map((t) => ({ ...t })) : [] };
    });
  };

  const toggleTaskLocal = (classId, index) => {
    ensureTaskEditsFor(classId);
    setTaskEdits((prev) => ({
      ...prev,
      [classId]: (prev[classId] || []).map((t, i) => (i === index ? { ...t, done: !t.done } : t)),
    }));
  };

  const removeTaskLocal = (classId, index) => {
    ensureTaskEditsFor(classId);
    setTaskEdits((prev) => ({
      ...prev,
      [classId]: (prev[classId] || []).filter((_, i) => i !== index),
    }));
  };

  const addTaskLocal = (classId, name) => {
    if (!name || !name.trim()) return;
    ensureTaskEditsFor(classId);
    setTaskEdits((prev) => ({
      ...prev,
      [classId]: [...(prev[classId] || []), { name: name.trim(), done: false }],
    }));
  };

  // Save local edits to Firestore for that class
  const saveTasksForClass = async (classId) => {
    const tasks = Array.isArray(taskEdits[classId]) ? taskEdits[classId] : [];
    try {
      await updateDoc(doc(db, "classes", classId), { tasks });
      // onSnapshot will refresh the UI
    } catch (err) {
      console.error("Failed to save tasks:", err);
      alert("Failed to save tasks.");
    }
  };

  // Add task to class quickly via input on card (adds to local edits)
  const handleQuickAdd = (classId, inputEl) => {
    if (!inputEl) return;
    const v = inputEl.value.trim();
    if (!v) return;
    addTaskLocal(classId, v);
    inputEl.value = "";
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Classroom Manager</h2>

        {/* Add/Edit Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-xl shadow-md mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Class Name"
              value={form.classname}
              onChange={(e) => setForm({ ...form, classname: e.target.value })}
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
              type="text"
              placeholder="Schedule (e.g. Mon/Wed or 2025-10-23)"
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              className="border rounded-lg p-2 w-full"
            />
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="border rounded-lg p-2 w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New task"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="border rounded-lg p-2 flex-1"
              />
              <button
                type="button"
                onClick={addTaskToForm}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg"
              >
                Add
              </button>
            </div>

            <div className="overflow-auto max-h-40 border rounded p-2 bg-white">
              {Array.isArray(form.tasks) && form.tasks.length > 0 ? (
                form.tasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!t.done}
                        onChange={() => toggleTaskDoneInForm(i)}
                      />
                      <span className={`${t.done ? "line-through text-gray-400" : ""}`}>
                        {t.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTaskFromForm(i)}
                      className="text-sm text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No tasks added yet.</p>
              )}
            </div>

            {/* Color selector (dots) */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">Color:</span>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Select color ${c}`}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`w-7 h-7 rounded-full border-2 ${form.color === c ? "ring-2 ring-offset-1" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="ml-auto text-xs text-gray-500">Selected</div>
            </div>

            <div className="sm:col-span-2 flex justify-end mt-2">
              <button
                type="submit"
                className="bg-green-600 text-white rounded-lg py-2 px-6 hover:bg-green-700"
              >
                {editId ? "Update Class" : "Add Class"}
              </button>
            </div>
          </div>
        </form>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                calendarRef.current?.getApi().changeView("dayGridMonth");
                setCalendarView("dayGridMonth");
              }}
              className={`px-3 py-1 rounded ${calendarView === "dayGridMonth" ? "bg-green-600 text-white" : "bg-white"}`}
            >
              Month
            </button>
          </div>
        </div>

<FullCalendar
  ref={calendarRef}
  plugins={[dayGridPlugin, interactionPlugin]}
  initialView={calendarView}
  events={filteredEvents}
  height="70vh"
  eventClick={(info) => {
    // info.event.extendedProps contains our custom props
    const ext = info.event.extendedProps || {};
    if (ext.type === "tasks" && Array.isArray(ext.tasks)) {
      setEventModalTitle(info.event.title || "Tasks");
      setEventModalTasks(ext.tasks);
      setEventModalOpen(true);
    } else {
      // class event clicked - optionally show basic details
      const title = info.event.title || "Class";
      const teacher = ext.teacher || "Unknown";
      const status = ext.status || "Unknown";
      setEventModalTitle(title);
      setEventModalTasks([{ name: `Teacher: ${teacher}`, done: false }, { name: `Status: ${status}`, done: false }]);
      setEventModalOpen(true);
    }
  }}
/>

{/* --- Add modal JSX somewhere near the bottom of the component (inside return, sibling to calendar) --- */}
{eventModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={() => setEventModalOpen(false)} />
    <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-4 z-10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold">{eventModalTitle}</h4>
        <button
          onClick={() => setEventModalOpen(false)}
          className="text-gray-500 hover:text-gray-800"
          aria-label="Close"
        >
          ✖
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-auto">
        {eventModalTasks.map((t, i) => (
          <div key={i} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 flex items-center justify-center rounded text-xs ${t.done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                {t.done ? "✓" : "•"}
              </span>
              <div className="text-sm">
                <div className={`${t.done ? "line-through text-gray-400" : ""}`}>{t.name}</div>
              </div>
            </div>
            {/* If you want a button to toggle status from modal you can implement it; for now this is read-only */}
            <div className="text-xs text-gray-400">{t.done ? "Done" : "Pending"}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => setEventModalOpen(false)} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
          Close
        </button>
      </div>
    </div>
  </div>
)}

        {/* Classes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {classes.length === 0 ? (
            <p className="col-span-3 text-gray-500 text-center">No Task yet.</p>
          ) : (
            classes.map((cls) => {
              const localTasks = Array.isArray(taskEdits[cls.id]) ? taskEdits[cls.id] : (Array.isArray(cls.tasks) ? cls.tasks.map((t) => ({ ...t })) : []);
              return (
                <div
                  key={cls.id}
                  className="text-white rounded-2xl p-5 shadow relative transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{ backgroundColor: cls.color || COLOR_OPTIONS[0] }}
                >
                  <h4 className="text-lg font-semibold mb-2">{cls.classname}</h4>
                  <p className="text-sm">{(Array.isArray(cls.tasks) ? cls.tasks.length : 0)} Tasks</p>
                  <p className="text-xs opacity-90">Teacher: {cls.teacher}</p>
                  <p className="text-xs opacity-90">Schedule: {cls.schedule}</p>
                  <p className="text-xs opacity-90 mb-2">Time: {formatTime(cls.time)}</p>

                  <div className="mb-3">
                    {localTasks.length === 0 ? (
                      <p className="text-xs text-white/70">No tasks</p>
                    ) : (
                      localTasks.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!t.done}
                              onChange={() => toggleTaskLocal(cls.id, i)}
                            />
                            <span className={`${t.done ? "line-through text-white/70" : ""}`}>
                              {t.name}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => removeTaskLocal(cls.id, i)}
                              className="text-red-300 text-xs"
                            >
                              del
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {cls.status === "Completed" ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-white/20">Completed</span>
                    ) : (
                      <button
                        onClick={() => advanceStatus(cls)}
                        className="bg-white/20 text-white border border-white/30 px-2 py-1 rounded hover:bg-green-500 hover:text-black transition"
                      >
                        Advance
                      </button>
                    )}
                  </div>

                  {/* Save tasks / quick-add */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add task..."
                        className="rounded p-1 text-xs w-full"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleQuickAdd(cls.id, e.target);
                          }
                        }}
                      />
                      <button
                        onClick={(ev) => {
                          const inp = ev.currentTarget.previousSibling;
                          handleQuickAdd(cls.id, inp);
                        }}
                        className="px-2 py-1 text-xs bg-white/20 rounded"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => saveTasksForClass(cls.id)}
                        className="bg-blue-600 text-white text-xs px-3 py-1 rounded"
                      >
                        Save Tasks
                      </button>
                      <button
                        onClick={() => handleEdit(cls)}
                        className="bg-white/20 text-white border border-white/30 px-3 py-1 rounded text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default Classroom;
