import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { sendNotification } from "../utils/sendNotification";

import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { query, where } from "firebase/firestore";


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
  // taskInput removed: tasks are added via class card quick-add
  const [editId, setEditId] = useState(null);

  // Add-task form state (separate from class form)
  const [taskClassId, setTaskClassId] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskComment, setNewTaskComment] = useState("");
  const [taskTarget, setTaskTarget] = useState("class"); // 'class' or 'date'
  const [taskDate, setTaskDate] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [dateTasks, setDateTasks] = useState([]);

    // monitoring state
    const [totalTasksCount, setTotalTasksCount] = useState(0);
    const [completedTasksCount, setCompletedTasksCount] = useState(0);
    const [completionPercent, setCompletionPercent] = useState(0);
    const prevCompletedRef = useRef(0);
    const [showCompletionToast, setShowCompletionToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [flashProgress, setFlashProgress] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
  

  // Inline/local task editing removed — tasks are managed through the Add Task panel or modals

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
const [eventModalTask, setEventModalTask] = useState(null); // single date-task for edit/delete in modal
const [selectedTaskIndex, setSelectedTaskIndex] = useState(null); // for class modal task selection

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

// include standalone date tasks in calendar events
const dateTaskEvents = (Array.isArray(dateTasks) ? dateTasks : []).map((t) => {
  // t.date expected in YYYY-MM-DD, time optional
  const start = t.date ? (t.time ? `${t.date}T${t.time}` : t.date) : null;
  return {
    title: t.name,
    start,
    color: t.color || "#374151",
    extendedProps: { type: "dateTask", taskId: t.id, done: !!t.done, comment: t.comment || "" },
    id: `dateTask-${t.id}`,
  };
});

  // ---------- Firestore: realtime listener for classes ----------
useEffect(() => {
  const unsubAuth = auth.onAuthStateChanged((user) => {
    if (!user) {
      setClasses([]);
      return;
    }

    const q = query(
      collection(db, "classes"),
      where("userId", "==", user.uid)  // ⬅ ONLY your classes
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClasses(docs);
    });

    return unsub;
  });

  return unsubAuth;
}, []);

  // listen to standalone tasks (date-based tasks)
  useEffect(() => {
    const q = collection(db, "tasks");
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDateTasks(docs);
      },
      (err) => console.error("Failed to listen to tasks:", err)
    );
    return () => unsub();
  }, []);

    // compute overall task completion metrics whenever classes or dateTasks change
    useEffect(() => {
      const classTaskItems = (classes || []).flatMap((c) => (Array.isArray(c.tasks) ? c.tasks : []));
      const dateTaskItems = Array.isArray(dateTasks) ? dateTasks : [];
  
      const totalClassTasks = classTaskItems.length;
      const totalDateTasks = dateTaskItems.length;
      const total = totalClassTasks + totalDateTasks;
  
      const completedClass = classTaskItems.filter((t) => !!t.done).length;
      const completedDate = dateTaskItems.filter((t) => !!t.done).length;
      const completed = completedClass + completedDate;
  
      setTotalTasksCount(total);
      setCompletedTasksCount(completed);
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      setCompletionPercent(pct);
  
      // detect increases in completed tasks to show a small toast and flash
      if (prevCompletedRef.current !== undefined && completed > prevCompletedRef.current) {
        const delta = completed - prevCompletedRef.current;
        setToastMessage(`${delta} task${delta > 1 ? 's' : ''} completed`);
        setShowCompletionToast(true);
        setFlashProgress(true);
        setTimeout(() => setFlashProgress(false), 900);
        // hide toast after 3s
        setTimeout(() => setShowCompletionToast(false), 3000);
      }
      prevCompletedRef.current = completed;
    }, [classes, dateTasks]);

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
    setEditId(null);
  };

  // Form-local task helpers (for the add/edit form)
  // Tasks are managed on each class card (quick-add) so the top form no longer edits tasks.

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
  userId: auth.currentUser.uid,   // ⬅⬅⬅ THIS IS IMPORTANT
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
      // do not load tasks into the top form; tasks are managed on the class card
      tasks: [],
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

  // Task card inline editing and quick-add removed — tasks are managed through the Add Task panel

  // Add task to a selected class from the right-column Add Task form.
  const handleAddTaskToClass = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const name = (newTaskName || "").trim();
    if (!name) return;

    try {
      if (taskTarget === "class") {
        if (!taskClassId) {
          alert("Please select a class to add the task to.");
          return;
        }
        const cls = classes.find((c) => c.id === taskClassId) || { tasks: [] };
        const tasks = Array.isArray(cls.tasks) ? cls.tasks : [];
        // include optional comment for class task
        await updateDoc(doc(db, "classes", taskClassId), { tasks: [...tasks, { name, done: false, comment: newTaskComment || "" }] });
      } else {
        // date task: store in 'tasks' collection
        if (!taskDate) {
          alert("Please select a date for this task.");
          return;
        }
await addDoc(collection(db, "tasks"), {
  name,
  date: taskDate,
  time: taskTime || null,
  done: false,
  comment: newTaskComment || "",
  userId: auth.currentUser.uid,   // ⬅ add this
  createdAt: serverTimestamp(),
});
      }

      setNewTaskName("");
      setTaskDate("");
      setTaskTime("");
  setNewTaskComment("");
    } catch (err) {
      console.error("Failed to add task:", err);
      alert("Failed to add task. Check console for details.");
    }
  };
useEffect(() => {
  const interval = setInterval(() => {
    const now = new Date();

    const allTasks = [
      ...classes.flatMap((cls) =>
        (cls.tasks || []).map((t) => ({
          ...t,
          date: cls.schedule,
          time: cls.time,
          classname: cls.classname,
        }))
      ),
      ...dateTasks,
    ];

    allTasks.forEach((task) => {
      if (!task.date) return;
      const taskDate = new Date(task.date + (task.time ? `T${task.time}` : "T00:00"));
      const diff = taskDate - now;

      if (diff > 0 && diff <= 60 * 60 * 1000 && !task.done) {
        sendNotification("Task Reminder", task.name + (task.classname ? ` (${task.classname})` : ""));
      }
    });
  }, 60 * 1000);

  return () => clearInterval(interval);
}, [classes, dateTasks]);

useEffect(() => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const todayTasks = [
    ...classes.flatMap((cls) =>
      (cls.tasks || []).map((t) => ({
        ...t,
        date: cls.schedule,
        time: cls.time,
        classname: cls.classname,
      }))
    ),
    ...dateTasks,
  ].filter((t) => t.date === today && !t.done);

  if (todayTasks.length) {
    sendNotification("Today's Tasks", todayTasks.map((t) => t.name).join("\n"));
  }
}, []);



  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Classroom Manager</h2>

        {/* Two equal columns: left = Add/Edit Class, right = Add Task */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-md w-full md:col-span-1 flex flex-col h-full md:min-h-[280px]">
            <h3 className="text-lg font-medium mb-3">Add Class</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-sm text-gray-600">Class Name</label>
              <input
                type="text"
                placeholder="Class Name"
                value={form.classname}
                onChange={(e) => setForm({ ...form, classname: e.target.value })}
                className="border rounded p-2 w-full placeholder-gray-400 text-sm"
              />

              <label className="text-sm text-gray-600">Teacher</label>
              <input
                type="text"
                placeholder="Teacher"
                value={form.teacher}
                onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                className="border rounded p-2 w-full placeholder-gray-400 text-sm"
              />

  
             <label className="text-sm text-gray-600">Day(s) of week</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => {
                  const active = Array.isArray(form.schedule) && form.schedule.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setForm((prev) => {
                          const prevDays = Array.isArray(prev.schedule) ? prev.schedule : [];
                          if (prevDays.includes(d)) {
                            return { ...prev, schedule: prevDays.filter((x) => x !== d) };
                          }
                          return { ...prev, schedule: [...prevDays, d] };
                        });
                      }}
                      className={`px-3 py-1 rounded text-sm ${active ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
                    >
                      {d.slice(0,3)}
                    </button>
                  );
                })}
              </div>

              <label className="text-sm text-gray-600">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="border rounded p-2 w-full text-sm"
              />

              <label className="text-sm text-gray-600">Color</label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Select color ${c}`}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`w-6 h-6 rounded-full border ${form.color === c ? "ring-1" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <div className="flex justify-end mt-2">
                <button type="submit" className="bg-green-600 text-white rounded px-4 py-2 text-sm hover:bg-green-700">
                  {editId ? "Update Class" : "Add Class"}
                </button>
              </div>
            </form>
          </div>



          {/* Right column: Add Task to selected class */}
          <div className="bg-white p-4 rounded-xl shadow-md w-full md:col-span-1 flex flex-col h-full md:min-h-[280px] justify-center">
            <h3 className="text-lg font-medium mb-3">Add Task</h3>
            <form onSubmit={handleAddTaskToClass} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className={`px-3 py-1 rounded cursor-pointer ${taskTarget === 'class' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                  <input className="hidden" type="radio" name="taskTarget" value="class" checked={taskTarget === 'class'} onChange={() => setTaskTarget('class')} />
                  Add to Class
                </label>
                <label className={`px-3 py-1 rounded cursor-pointer ${taskTarget === 'date' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                  <input className="hidden" type="radio" name="taskTarget" value="date" checked={taskTarget === 'date'} onChange={() => setTaskTarget('date')} />
                  Add to Date
                </label>
              </div>

              {taskTarget === 'class' ? (
                <>
                <label className="text-sm text-gray-600">Task name</label>
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Enter task name"
                    className="border rounded p-2 w-full text-sm placeholder-gray-400"
                  />
                  <label className="text-sm text-gray-600">Select Class</label>
                  <select
                    value={taskClassId}
                    onChange={(e) => setTaskClassId(e.target.value)}
                    className="border rounded p-2 w-full text-sm"
                  >
                    <option value="">-- Select class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.classname}</option>
                    ))}
                  </select>
                  <label className="text-sm text-gray-600">Description (optional)</label>
                  <textarea
                    value={newTaskComment}
                    onChange={(e) => setNewTaskComment(e.target.value)}
                    placeholder="Add a short description or notes for this task"
                    className="border rounded p-2 h-20 text-sm w-full placeholder-gray-400"
                  />
                </>
              ) : (
                <>
                  <label className="text-sm text-gray-600">Task name</label>
                  <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task name"
                  className="border rounded p-2"
                  />
                  <label className="text-sm text-gray-600">Date</label>
                  <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="border rounded p-2" />
                  <label className="text-sm text-gray-600">Time (optional)</label>
                  <input type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} className="border rounded p-2" />
                  <label className="text-sm text-gray-600">Comment (optional)</label>
                  <textarea
                    value={newTaskComment}
                    onChange={(e) => setNewTaskComment(e.target.value)}
                    placeholder="Add a short description or notes for this calendar task"
                    className="border rounded p-2 h-24"
                  />
                </>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>

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
                  {/* Task completion monitoring */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">Progress</div>
            <div className="w-48 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full ${flashProgress ? 'animate-pulse' : ''}`}
                style={{ width: `${Math.min(100, Math.max(0, completionPercent))}%`, backgroundColor: '#10B981' }}
                title={`${completionPercent}%`}
              />
            </div>
            <div className="text-sm text-gray-700">{completedTasksCount}/{totalTasksCount}</div>
            <button
              onClick={() => setShowProgressModal(true)}
              className="ml-3 px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
            >
              View Progress
            </button>
          </div>


<FullCalendar
  ref={calendarRef}
  plugins={[dayGridPlugin, interactionPlugin]}
  initialView={calendarView}
  events={[...filteredEvents, ...dateTaskEvents]}
  height="70vh"
  eventClick={(info) => {
    const ext = info.event.extendedProps || {};
    if (ext.type === "tasks" && Array.isArray(ext.tasks)) {
      setEventModalTitle(info.event.title || "Tasks");
      setEventModalTasks(ext.tasks);
      setEventModalOpen(true);
    } else if (ext.type === 'dateTask') {
      // load the full task doc from dateTasks (real-time listener) so we can edit/delete it
      const taskId = ext.taskId;
      const taskDoc = (dateTasks || []).find((t) => t.id === taskId) || {
        id: taskId,
        name: info.event.title || "",
        date: info.event.startStr ? info.event.startStr.split('T')[0] : "",
        time: info.event.startStr && info.event.startStr.includes('T') ? info.event.startStr.split('T')[1].slice(0,5) : "",
        comment: ext.comment || "",
        done: !!ext.done,
      };
      setEventModalTitle(taskDoc.name || 'Task');
      setEventModalTask(taskDoc);
      setEventModalTasks([]);
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
        {eventModalTask ? (
          <div className="flex flex-col gap-2 p-2">
            <label className="text-sm text-gray-600">Task name</label>
            <input
              type="text"
              value={eventModalTask.name || ''}
              onChange={(e) => setEventModalTask((s) => ({ ...s, name: e.target.value }))}
              className="border rounded p-2"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-600">Date</label>
                <input
                  type="date"
                  value={eventModalTask.date || ''}
                  onChange={(e) => setEventModalTask((s) => ({ ...s, date: e.target.value }))}
                  className="border rounded p-2 w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Time (optional)</label>
                <input
                  type="time"
                  value={eventModalTask.time || ''}
                  onChange={(e) => setEventModalTask((s) => ({ ...s, time: e.target.value }))}
                  className="border rounded p-2 w-full"
                />
              </div>
            </div>

            <label className="text-sm text-gray-600">Comment</label>
            <textarea
              value={eventModalTask.comment || ''}
              onChange={(e) => setEventModalTask((s) => ({ ...s, comment: e.target.value }))}
              className="border rounded p-2 h-24"
            />

            <div className="flex items-center gap-2">
              <input
                id="modalDone"
                type="checkbox"
                checked={!!eventModalTask.done}
                onChange={(e) => setEventModalTask((s) => ({ ...s, done: e.target.checked }))}
              />
              <label htmlFor="modalDone" className="text-sm text-gray-600">Done</label>
            </div>
          </div>
        ) : eventModalTasks && eventModalTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="max-h-64 overflow-auto space-y-2">
              {eventModalTasks.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTaskIndex(i)}
                  className={`w-full text-left p-2 rounded ${selectedTaskIndex === i ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 flex items-center justify-center rounded text-xs ${t.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {t.done ? '✓' : '•'}
                    </span>
                    <div className="text-sm">
                      <div className={`${t.done ? 'line-through text-gray-400' : ''}`}>{t.name}</div>
                      {t.comment ? <div className="text-xs text-gray-500 mt-1">{t.comment}</div> : null}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{t.done ? 'Done' : 'Pending'}</div>
                </button>
              ))}
            </div>
            <div className="p-2 border-l">
              {selectedTaskIndex !== null && eventModalTasks[selectedTaskIndex] ? (
                <div>
                  <h5 className="font-medium mb-2">{eventModalTasks[selectedTaskIndex].name}</h5>
                  {eventModalTasks[selectedTaskIndex].comment ? (
                    <p className="text-sm text-gray-600 mb-2">{eventModalTasks[selectedTaskIndex].comment}</p>
                  ) : (
                    <p className="text-sm text-gray-500 mb-2">No description</p>
                  )}
                  <p className="text-sm text-gray-500">Date: {eventModalTasks[selectedTaskIndex].date || '—'}</p>
                  <p className="text-sm text-gray-500">Time: {eventModalTasks[selectedTaskIndex].time || '—'}</p>
                  <p className="text-sm text-gray-500">Status: {eventModalTasks[selectedTaskIndex].done ? 'Done' : 'Pending'}</p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Select a task to see details</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No tasks</div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        {eventModalTask ? (
          <>
            <button
              onClick={async () => {
                try {
                  const id = eventModalTask.id;
                  if (!id) return;
                  await updateDoc(doc(db, "tasks", id), {
                    name: eventModalTask.name || "",
                    date: eventModalTask.date || "",
                    time: eventModalTask.time || null,
                    comment: eventModalTask.comment || "",
                    done: !!eventModalTask.done,
                  });
                  setEventModalTask(null);
                  setEventModalOpen(false);
                } catch (err) {
                  console.error("Failed to save task:", err);
                  alert("Failed to save task. Check console for details.");
                }
              }}
              className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={async () => {
                if (!eventModalTask || !eventModalTask.id) return;
                if (!window.confirm("Delete this task?")) return;
                try {
                  await deleteDoc(doc(db, "tasks", eventModalTask.id));
                  setEventModalTask(null);
                  setEventModalOpen(false);
                } catch (err) {
                  console.error("Failed to delete task:", err);
                  alert("Failed to delete task. Check console for details.");
                }
              }}
              className="px-3 py-1 rounded bg-red-500 text-white hover:brightness-90"
            >
              Delete
            </button>
            <button onClick={() => { setEventModalTask(null); setEventModalOpen(false); }} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setEventModalOpen(false)} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
            Close
          </button>
        )}
      </div>
    </div>
  </div>
)}

{/* Completion toast */}
{showCompletionToast && (
  <div className="fixed right-4 top-4 z-60">
    <div className="bg-green-600 text-white px-4 py-2 rounded shadow-lg">{toastMessage}</div>
  </div>
)}

{/* Progress Modal */}
{showProgressModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={() => setShowProgressModal(false)} />
    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 z-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Progress Summary</h3>
        <button onClick={() => setShowProgressModal(false)} className="text-gray-600 hover:text-gray-800">✖</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Overall Completion</p>
          <p className="text-3xl font-bold text-gray-800">{completionPercent}%</p>
          <div className="mt-3 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div style={{ width: `${Math.min(100, Math.max(0, completionPercent))}%`, backgroundColor: '#10B981' }} className="h-3 rounded-full" />
          </div>
          <div className="mt-3 text-sm text-gray-600">{completedTasksCount} done • {Math.max(0, totalTasksCount - completedTasksCount)} remaining • {totalTasksCount} total</div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Per-class breakdown</p>
          <div className="space-y-2 max-h-56 overflow-auto">
            {(classes || []).map((cls) => {
              const tasks = Array.isArray(cls.tasks) ? cls.tasks : [];
              const done = tasks.filter((t) => !!t.done).length;
              const total = tasks.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={cls.id} className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{cls.classname}</div>
                    <div className="text-xs text-gray-500">{done} / {total} done</div>
                    <div className="mt-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div style={{ width: `${pct}%`, backgroundColor: '#60A5FA' }} className="h-2 rounded-full" />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-semibold">{pct}%</div>
                </div>
              );
            })}
            { (Array.isArray(dateTasks) && dateTasks.length > 0) && (
              <div className="pt-2 border-t mt-2">
                <div className="text-sm font-medium text-gray-800">Date Tasks</div>
                <div className="text-xs text-gray-500">{dateTasks.filter(t => !!t.done).length} / {dateTasks.length} done</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button onClick={() => setShowProgressModal(false)} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Close</button>
      </div>
    </div>
  </div>
)}

        {/* Add margin between calendar and classes */}
        <div className="mb-8"></div>
        {/* Classes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {classes.length === 0 ? (
            <p className="col-span-3 text-gray-500 text-center">No Task yet.</p>
          ) : (
            classes.map((cls) => {
              return (
                <div
                  key={cls.id}
                  onClick={() => {
                    // open modal showing tasks for this class
                    const tasks = Array.isArray(cls.tasks) ? cls.tasks.map((t) => ({ ...t })) : [];
                    setEventModalTitle(cls.classname || 'Class');
                    setEventModalTasks(tasks);
                    setSelectedTaskIndex(tasks.length > 0 ? 0 : null);
                    setEventModalTask(null);
                    setEventModalOpen(true);
                  }}
                  className="group text-white rounded-2xl p-5 shadow relative transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                  style={{ backgroundColor: cls.color || COLOR_OPTIONS[0] }}
                >
                  {/* Hover-only actions (top-right) */}
                  <div className="absolute top-3 right-3 opacity-0 pointer-events-none transform scale-95 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100 transition-all duration-200">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-full p-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(cls); }}
                        className="text-sm bg-white/20 text-white px-3 py-1 rounded hover:bg-white/40"
                        aria-label={`Edit ${cls.classname}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }}
                        className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:brightness-90"
                        aria-label={`Delete ${cls.classname}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{cls.classname}</h4>
                  <p className="text-sm">{(Array.isArray(cls.tasks) ? cls.tasks.length : 0)} Tasks</p>
                  <p className="text-xs opacity-90">Teacher: {cls.teacher}</p>
                  <p className="text-xs opacity-90">Schedule: {cls.schedule}</p>
                  <p className="text-xs opacity-90 mb-2">Time: {formatTime(cls.time)}</p>

                  {/* Card simplified: only show summary info (tasks count, teacher, schedule, time). Click card to view tasks. */}

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

                  {/* Simplified card — actions available via hover (Edit/Delete) or open modal by clicking card */}
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