import dotenv from "dotenv";

dotenv.config(); // load HF_API_KEY from environment variables

// Helper to parse dates
function toDate(d) {
  if (!d) return null;
  try {
    if (d.toDate && typeof d.toDate === "function") return d.toDate();
    return new Date(d);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const HF_API_KEY = process.env.HF_API_KEY;

  const { user = {}, tasks = [], expenses = [] } = req.body;
  const now = new Date();

  let recs = [];

  // Local Recommendation Logic
  try {
    const overdue = tasks.filter(
      (t) => toDate(t.schedule) < now && t.status !== "Completed" && t.status !== "done"
    );
    if (overdue.length) recs.push(`You have ${overdue.length} overdue task(s). Focus on completing them.`);

    const upcoming = tasks.filter((t) => {
      const d = toDate(t.schedule);
      if (!d) return false;
      const diff = (d - now) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 3 && t.status !== "Completed" && t.status !== "done";
    });
    if (upcoming.length) recs.push(`You have ${upcoming.length} task(s) due soon. Plan short study sessions.`);

    if (tasks.length >= 5) recs.push("Your schedule is busy — consider breaking tasks into smaller chunks.");

    const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    if (total > 500) recs.push("Your expenses are high — try reducing non-essential spending.");

    const categories = {};
    expenses.forEach((e) => {
      if (!e.category) return;
      categories[e.category] = (categories[e.category] || 0) + (Number(e.amount) || 0);
    });
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) recs.push(`You spend the most on ${topCategory[0]}. Consider adjusting this.`);

    if (!recs.length) recs.push("Everything looks balanced — great job managing your tasks and expenses.");
  } catch (err) {
    console.error("Local recommendation error:", err);
  }

  // Hugging Face AI Integration
  try {
    const prompt = `User info: ${JSON.stringify(user)}
Class: ${user.class || "N/A"}
Tasks: ${JSON.stringify(tasks)}
Expenses: ${JSON.stringify(expenses)}

Provide 3 personalized recommendations for this user on what they should focus on next.`;

    const response = await fetch("https://api-inference.huggingface.co/models/bloom-560m", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    const data = await response.json();

    if (data && data[0] && data[0].generated_text) {
      const aiText = data[0].generated_text;
      const aiRecs = aiText
        .split(/\.\s+/)
        .slice(0, 3)
        .map((s) => s.trim())
        .filter(Boolean);

      if (aiRecs.length) recs = aiRecs;
    }
  } catch (err) {
    console.error("Hugging Face AI error:", err);
  }

  res.status(200).json({ recommendations: recs.slice(0, 3) });
}
