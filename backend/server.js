import express from "express";
import cors from "cors";
import Bytez from "bytez.js";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Bytez SDK
const API_KEY = "6fee0063adfcf5e62ef6a3c6d235fd6e"; // replace with your actual key
const sdk = new Bytez(API_KEY);
const model = sdk.model("openai/gpt-4o");

// Helper to parse Firestore dates
function toDate(d) {
  if (!d) return null;
  try {
    if (d.toDate && typeof d.toDate === "function") return d.toDate();
    return new Date(d);
  } catch {
    return null;
  }
}

// -----------------------------
// POST /api/ai-suggestions
// -----------------------------
app.post("/api/ai-suggestions", async (req, res) => {
  const { tasks = [], expenses = [] } = req.body;
  const now = new Date();

  let recs = [];

  // -----------------------------
  // Local Recommendation Logic
  // -----------------------------
  try {
    const overdue = tasks.filter(
      (t) => toDate(t.schedule) < now && t.status !== "Completed" && t.status !== "done"
    );
    if (overdue.length) recs.push(`You have ${overdue.length} overdue task(s). Finish them today.`);

    const upcoming = tasks.filter((t) => {
      const d = toDate(t.schedule);
      if (!d) return false;
      const diff = (d - now) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 3 && t.status !== "Completed" && t.status !== "done";
    });
    if (upcoming.length) recs.push(`You have ${upcoming.length} task(s) due soon. Schedule short study blocks.`);

    if (tasks.length >= 5) recs.push("Your schedule is busy — break tasks into smaller chunks.");

    const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    if (total > 500) recs.push("Your expenses are high — reduce non-essential spending.");

    const categories = {};
    expenses.forEach((e) => {
      if (!e.category) return;
      categories[e.category] = (categories[e.category] || 0) + (Number(e.amount) || 0);
    });

    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) recs.push(`You spend the most on ${topCategory[0]}. Consider reducing costs there.`);

    if (!recs.length) recs.push("Everything looks balanced — great job managing your tasks and expenses.");
  } catch (err) {
    console.error("Local recommendation error:", err);
  }

  // -----------------------------
  // Bytez AI Integration
  // -----------------------------
  try {
    const prompt = [
      {
        role: "user",
        content: `Provide 3 personalized recommendations for the following tasks and expenses:\nTasks: ${JSON.stringify(
          tasks
        )}\nExpenses: ${JSON.stringify(expenses)}`
      }
    ];

    const { error, output } = await model.run(prompt);

    if (error) console.error("Bytez AI returned error:", error);

    if (output && output.length) {
      const aiRecs = output
        .map((item) => (typeof item === "string" ? item : item.content))
        .filter(Boolean);

      if (aiRecs.length) {
        console.log("Bytez AI recommendations:", aiRecs);
        // Replace local recommendations with AI output
        recs = aiRecs.slice(0, 3);
      }
    } else {
      console.log("Bytez AI returned empty output. Using local recommendations.");
    }
  } catch (err) {
    console.error("Bytez AI integration error:", err);
  }

  res.json({ recommendations: recs.slice(0, 3) });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
