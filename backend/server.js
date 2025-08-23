const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let tasks = [];
let finishedTasks = []; // Add this array to store completed tasks

// GET all active tasks
app.get("/tasks", (req, res) => {
  const allTasks = [...tasks, ...finishedTasks];
  res.json(tasks);
});

// GET completed tasks (optional endpoint if you want to fetch them separately)
app.get("/tasks/completed", (req, res) => {
  res.json(finishedTasks);
});

// POST new task (with deadline support)
app.post("/tasks", (req, res) => {
  const { title, category, deadline } = req.body || {};
  if (!title) return res.status(400).json({ error: "Task title is required" });
  if (!category) return res.status(400).json({ error: "Category is required" });

  const newTask = {
    id: Date.now(),
    title,
    category,
    deadline: deadline || null,
    completed: false, // Add completed field
    completedAt: null // Add completedAt field
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// UPDATE task (for updating deadline, title/category, or marking as complete)
app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, category, deadline, completed, completedAt } = req.body;

  // First check if task is in active tasks
  let task = tasks.find((t) => t.id === id);
  
  // If not found in active tasks, check completed tasks
  if (!task) {
    task = finishedTasks.find((t) => t.id === id);
  }

  if (!task) return res.status(404).json({ error: "Task not found" });

  // Handle marking as completed
  if (completed !== undefined) {
    task.completed = completed;
    if (completed && completedAt) {
      task.completedAt = completedAt;
      
      // Move task from active to completed if it's being marked as done
      if (tasks.includes(task)) {
        tasks = tasks.filter(t => t.id !== id);
        finishedTasks.push(task);
      }
    } else if (!completed) {
      task.completedAt = null;
      // Move task from completed back to active if it's being un-done
      if (finishedTasks.includes(task)) {
        finishedTasks = finishedTasks.filter(t => t.id !== id);
        tasks.push(task);
      }
    }
  }

  // Update other fields
  if (title !== undefined) task.title = title;
  if (category !== undefined) task.category = category;
  if (deadline !== undefined) task.deadline = deadline;

  res.json(task);
});

// DELETE task (from either active or completed)
app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  
  // Try to delete from active tasks first
  const activeIdx = tasks.findIndex((t) => t.id === id);
  if (activeIdx !== -1) {
    tasks.splice(activeIdx, 1);
    return res.json({ success: true });
  }
  
  // If not found in active, try completed tasks
  const completedIdx = finishedTasks.findIndex((t) => t.id === id);
  if (completedIdx !== -1) {
    finishedTasks.splice(completedIdx, 1);
    return res.json({ success: true });
  }

  return res.status(404).json({ error: "Task not found" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});