export default async function handler(req, res) {
  // --- CORS HEADERS ---
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // --- Handle preflight ---
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- Allow ONLY POST ---
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed." });
  }

  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) {
    return res.status(500).json({ error: "Missing HF_API_KEY" });
  }

  const { tasks = [], expenses = [] } = req.body;
  const now = new Date();
  let recs = [];

  // --- Local recommendation logic ---
  const overdue = tasks.filter(
    t =>
      new Date(t.schedule) < now &&
      t.status !== "Completed" &&
      t.status !== "done"
  );
  if (overdue.length)
    recs.push(
      `You have ${overdue.length} overdue task(s). Focus on completing them.`
    );

  const upcoming = tasks.filter(t => {
    const d = new Date(t.schedule);
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 3 && t.status !== "Completed";
  });
  if (upcoming.length)
    recs.push(`You have ${upcoming.length} upcoming task(s). Prepare early!`);

  const totalExpense = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  if (totalExpense > 500)
    recs.push("Your expenses are high — consider budgeting more carefully.");

  // --- HuggingFace AI call ---
  try {
    const prompt = `Tasks: ${JSON.stringify(tasks)}
Expenses: ${JSON.stringify(expenses)}
Provide 3 personalized recommendations.`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/bloom-560m",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    const data = await response.json();

    if (data?.[0]?.generated_text) {
      let ai = data[0].generated_text
        .split(".")
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 3);

      if (ai.length) recs = ai;
    }
  } catch (err) {
    console.log("AI error:", err);
  }

  return res.status(200).json({ recommendations: recs });
}
