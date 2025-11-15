import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/ai-suggestions", (req, res) => {
  res.json({
    recommendations: [
      "Prioritize urgent tasks today",
      "Reduce unnecessary expenses this week",
      "Try scheduling study blocks more efficiently"
    ]
  });
});

app.listen(3001, () => console.log("Server running on port 3001"));
