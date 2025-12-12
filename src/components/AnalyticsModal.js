import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { PieChart, Pie, Cell } from "recharts"; // optional small pie preview
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import myFont from "./NotoSans-Regular.ttf";

export default function AnalyticsModal() {
  const [open, setOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const qExp = query(collection(db, "expenses"), where("userId", "==", uid));
    const unsubExp = onSnapshot(qExp, (snap) => {
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qCls = query(collection(db, "classes"), where("userId", "==", uid));
    const unsubCls = onSnapshot(qCls, (snap) => {
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qTasks = query(collection(db, "tasks"), where("userId", "==", uid));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubExp(); unsubCls(); unsubTasks();
    };
  }, []);

  // Helpers to normalise date fields from different shapes (timestamp or ISO string)
  const formatDateForTable = (d) => {
    if (!d) return "—";
    // firebase Timestamp?
    if (d?.seconds) {
      return new Date(d.seconds * 1000).toLocaleDateString();
    }
    // ISO string (YYYY-MM-DD) or date string
    try {
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) return dt.toLocaleDateString();
    } catch (e) {}
    return String(d);
  };

  // Category totals
  const categoryTotals = expenses.reduce((acc, e) => {
    const k = e.category || "Uncategorized";
    acc[k] = (acc[k] || 0) + Number(e.amount || 0);
    return acc;
  }, {});
  const categoryData = Object.entries(categoryTotals).map(([label, value]) => ({ label, value }));

  // Expense history by date
  const dailyTotals = {};
  expenses.forEach((e) => {
    const dateKey = (() => {
      if (!e.date) return "No date";
      if (e.date?.seconds) return new Date(e.date.seconds * 1000).toLocaleDateString();
      const dt = new Date(e.date);
      if (!isNaN(dt.getTime())) return dt.toLocaleDateString();
      return String(e.date);
    })();
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + Number(e.amount || 0);
  });
  const expenseHistory = Object.entries(dailyTotals).map(([date, total]) => ({ date, total }));

  // Tasks list and completion stat
  const allTasksList = [
    ...tasks.map((t) => ({ id: t.id, name: t.name || t.title || "Task", date: t.date, time: t.time || "", comment: t.comment || "", status: t.done ? "Completed" : (t.status || "Not Yet Completed") })),
    // class tasks (flatten)
    ...classes.flatMap((c) => (Array.isArray(c.tasks) ? c.tasks.map((t, i) => ({
      id: `class-${c.id}-${i}`,
      name: t.name || t.taskName || t,
      date: c.schedule || t.date || "",
      time: c.time || t.time || "",
      comment: t.comment || "",
      status: t.done ? "Completed" : "Not Yet Completed",
      class: c.classname || ""
    })) : []))
  ];

  const completedCount = allTasksList.filter((t) => t.status === "Completed" || t.status === "Done" || t.status === true).length;
  const totalTasks = allTasksList.length;

  // PDF export using jsPDF + autotable
  const downloadPDF = () => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;

    // header
    const email = auth.currentUser?.email || "";
    const username = email.split("@")[0] || "User";
    pdf.setFontSize(18);
    pdf.text(`GreenMate Analytics Report`, margin, 60);
    pdf.setFontSize(11);
    pdf.text(`User: ${username} (${email})`, margin, 80);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 95);

    let cursorY = 115;
pdf.addFileToVFS("NotoSans.ttf", myFont);
pdf.addFont("NotoSans.ttf", "NotoSans", "normal");
pdf.setFont("NotoSans");
pdf.setFont("Helvetica", "normal"); // avoid encoding issues
pdf.setFontSize(13);
pdf.text("Expense by Category", margin, cursorY);
cursorY += 10;

const catTable = {
  head: [["Category", "Amount (PHP)", "Total"]],
  body: categoryData.map((c) => [
    c.label,
    `PHP ${Number(c.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    ""
  ]),
};

autoTable(pdf, {
  startY: cursorY + 6,
  head: catTable.head,
  body: catTable.body,
  theme: "grid",
  styles: { fontSize: 10, cellPadding: 6 },
  headStyles: { fillColor: [240, 240, 240] },
  parseHtml: false, // <-- IMPORTANT FIX
  didParseCell: (data) => {
    data.cell.styles.textColor = [0, 0, 0];
  }
});

cursorY = pdf.lastAutoTable?.finalY + 12;



    // Classes table
    pdf.setFontSize(13);
    pdf.text("Classes", margin, cursorY);
    cursorY += 10;

    const classesBody = classes.map((c) => [
      c.classname || "—",
      c.teacher || "—",
      Array.isArray(c.schedule) ? c.schedule.join(", ") : (c.schedule || "—"),
      c.time || "—",
      c.color || "—",
    ]);

autoTable(pdf, {
  startY: cursorY + 6,
  head: [["Class Name", "Teacher", "Day/s of week", "Time", "Color"]],
  body: classesBody,
  theme: "grid",
  styles: { fontSize: 10, cellPadding: 6 },
  headStyles: { fillColor: [240, 240, 240] },
});
cursorY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 12 : cursorY + 120;



    // Tasks table
    pdf.setFontSize(13);
    pdf.text("Tasks", margin, cursorY);
    cursorY += 10;

    const tasksBody = allTasksList.map((t) => [
      t.name || "—",
      t.date ? formatDateForTable(t.date) : "—",
      t.time || "—",
      t.comment || "N/A",
      t.status || "Not Yet Completed",
    ]);

autoTable(pdf, {
  startY: cursorY + 6,
  head: [["Tasks Name", "Date", "Time", "Comment", "Status"]],
  body: tasksBody,
  theme: "grid",
  styles: { fontSize: 10, cellPadding: 6 },
  headStyles: { fillColor: [240, 240, 240] },
  didDrawPage: function () {
    const pageCount = pdf.getNumberOfPages();
    const current = pdf.getCurrentPageInfo
      ? pdf.getCurrentPageInfo().pageNumber
      : pdf.internal.getNumberOfPages();

    pdf.setFontSize(9);
    pdf.text(
      `Page ${current} / ${pageCount}`,
      pageWidth - margin - 60,
      pdf.internal.pageSize.getHeight() - 20
    );
  },
});


    // If autopages > 1 autoplace page numbers (autotable draws pages as it needs)
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.text(`Page ${i} / ${totalPages}`, pageWidth - margin - 60, pdf.internal.pageSize.getHeight() - 20);
    }

    // Save
    pdf.save("greenmate_analytics_report.pdf");
  };

  // small pie colours for preview
  const COLORS = ["#60A5FA", "#34D399", "#FBBF24", "#F87171", "#A78BFA", "#9CA3AF"];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        View Analytics
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50">
          <div className="bg-white w-[95%] max-w-4xl rounded-lg shadow-lg p-6 max-h-[85vh] overflow-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">GreenMate Analytics Report</h2>
                <p className="text-sm text-gray-500">User: {auth.currentUser?.email?.split("@")[0] || "User"}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={downloadPDF} className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">Download PDF</button>
                <button onClick={() => setOpen(false)} className="text-xl text-gray-600">✖</button>
              </div>
            </div>

            {/* Small preview: categories (pie) + history + stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-3 border rounded">
                <h4 className="font-medium mb-2">Expenses by category</h4>
                <div style={{ width: 160, height: 120 }}>
                  <PieChart width={160} height={120}>
                    <Pie data={categoryData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={40} innerRadius={16}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </div>
                <ul className="text-sm mt-2">
                  {categoryData.map((c) => (
                    <li key={c.label} className="flex justify-between"><span>{c.label}</span><span>₱{Number(c.value).toLocaleString(undefined,{minimumFractionDigits:2})}</span></li>
                  ))}
                </ul>
              </div>

              <div className="p-3 border rounded">
                <h4 className="font-medium mb-2">Expense history</h4>
                <div className="text-xs text-gray-600 max-h-40 overflow-auto">
                  {expenseHistory.map((h) => (
                    <div key={h.date} className="flex justify-between py-1">
                      <div>{h.date}</div>
                      <div>₱{Number(h.total).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 border rounded">
                <h4 className="font-medium mb-2">Tasks</h4>
                <div className="text-sm">
                  <div>Total tasks: <strong>{totalTasks}</strong></div>
                  <div>Completed: <strong>{completedCount}</strong></div>
                  <div>Completion: <strong>{totalTasks > 0 ? Math.round((completedCount/totalTasks)*100) : 0}%</strong></div>
                </div>
              </div>
            </div>

            {/* Tables previews */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Expense by Category</h4>
                <table className="w-full text-sm table-auto border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-2 text-left">Category</th><th className="p-2 text-right">Amount</th></tr></thead>
                  <tbody>
                    {categoryData.map((c) => (
                      <tr key={c.label}><td className="p-2">{c.label}</td><td className="p-2 text-right">₱{Number(c.value).toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Classes</h4>
                <table className="w-full text-sm table-auto border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-2 text-left">Class</th><th className="p-2">Teacher</th><th className="p-2">Day(s)</th><th className="p-2">Time</th><th className="p-2">Color</th></tr></thead>
                  <tbody>
                    {classes.map((c) => (
                      <tr key={c.id}><td className="p-2">{c.classname}</td><td className="p-2">{c.teacher}</td><td className="p-2">{Array.isArray(c.schedule) ? c.schedule.join(", ") : (c.schedule || "—")}</td><td className="p-2">{c.time || "—"}</td><td className="p-2">{c.color || "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Tasks</h4>
                <table className="w-full text-sm table-auto border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-2">Task</th><th className="p-2">Date</th><th className="p-2">Time</th><th className="p-2">Comment</th><th className="p-2">Status</th></tr></thead>
                  <tbody>
                    {allTasksList.slice(0, 50).map((t) => (
                      <tr key={t.id}><td className="p-2">{t.name}</td><td className="p-2">{formatDateForTable(t.date)}</td><td className="p-2">{t.time || "—"}</td><td className="p-2">{t.comment || "N/A"}</td><td className="p-2">{t.status}</td></tr>
                    ))}
                  </tbody>
                </table>
                {allTasksList.length > 50 && <div className="text-xs text-gray-500 mt-1">Only first 50 tasks shown in preview. PDF contains all tasks.</div>}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
