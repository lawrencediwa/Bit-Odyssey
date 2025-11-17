import dotenv from "dotenv";

dotenv.config(); // Only needed locally, Vercel injects env variables automatically

function toDate(d) {
  if (!d) return null;
  if (d.toDate && typeof d.toDate === "function") return d.toDate();
  return new Date(d);
}

export default async function handler(req, res) {
  // Optional: allow GET for testing
  if (req.method === "GET") {
    return res.status(200).json({ message: "Use POST to get AI recommendations." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) return res.status(500).json({ error: "HF_API_KEY not set" });

  const { tasks = [], expenses = [] } = req.body;
  const now = new Date();
  let recs = [];

  try {
    // Local recommendation logic
    const overdue = tasks.filter(t => toDate(t.schedule) < now && t.status !== "Completed" && t.status !== "done");
    if (overdue.length) recs.push(`You have ${overdue.length} overdue task(s). Focus on completing them.`);

    const upcoming = tasks.filter(t => {
      const d = toDate(t.schedule);
      if (!d) return false;
      const diff = (d - now) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 3 && t.status !== "Completed" && t.status !== "done";
    });
    if (upcoming.length) recs.push(`You have ${upcoming.length} task(s) due soon. Plan short study sessions.`);

    const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    if (totalExpense > 500) recs.push("Your expenses are high — consider reducing non-essential spending.");
  } catch (err) {
    console.error("Local recommendation error:", err);
  }

  try {
    const prompt = `Tasks: ${JSON.stringify(tasks)}
Expenses: ${JSON.stringify(expenses)}
Provide 3 personalized recommendations.`;

    const response = await fetch("https://api-inference.huggingface.co/models/bloom-560m", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    const data = await response.json();
    if (data?.[0]?.generated_text) {
      const aiRecs = data[0].generated_text
        .split(/\.\s+/)
        .slice(0, 3)
        .map(s => s.trim())
        .filter(Boolean);

      if (aiRecs.length) recs = aiRecs;
    }
  } catch (err) {
    console.error("Hugging Face AI error:", err);
  }

  res.status(200).json({ recommendations: recs.slice(0, 3) });
}
