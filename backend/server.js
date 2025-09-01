const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let tasks = [];
let finishedTasks = [];

// ✅ GET active tasks
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// ✅ GET completed tasks
app.get("/tasks/completed", (req, res) => {
  res.json(finishedTasks);
});

// ✅ POST new task
app.post("/tasks", (req, res) => {
  const { title, category, deadline } = req.body || {};
  if (!title) return res.status(400).json({ error: "Task title is required" });
  if (!category) return res.status(400).json({ error: "Category is required" });

  const newTask = {
    id: Date.now(),
    title,
    category,
    deadline: deadline || null,
    completed: false,
    completedAt: null,
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// ✅ PUT update task (deadline, mark complete, etc.)
app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, category, deadline, completed, completedAt } = req.body;

  let task = tasks.find((t) => t.id === id) || finishedTasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  if (completed !== undefined) {
    task.completed = completed;
    if (completed && completedAt) {
      task.completedAt = completedAt;
      if (tasks.includes(task)) {
        tasks = tasks.filter((t) => t.id !== id);
        finishedTasks.push(task);
      }
    } else if (!completed) {
      task.completedAt = null;
      if (finishedTasks.includes(task)) {
        finishedTasks = finishedTasks.filter((t) => t.id !== id);
        tasks.push(task);
      }
    }
  }

  if (title !== undefined) task.title = title;
  if (category !== undefined) task.category = category;
  if (deadline !== undefined) task.deadline = deadline;

  res.json(task);
});

// ✅ DELETE task
app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const activeIdx = tasks.findIndex((t) => t.id === id);
  if (activeIdx !== -1) {
    tasks.splice(activeIdx, 1);
    return res.json({ success: true });
  }

  const completedIdx = finishedTasks.findIndex((t) => t.id === id);
  if (completedIdx !== -1) {
    finishedTasks.splice(completedIdx, 1);
    return res.json({ success: true });
  }

  res.status(404).json({ error: "Task not found" });
});

// ✅ health check (so Render doesn’t show "Cannot GET /")
app.get("/", (req, res) => {
  res.send("Task Manager API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
