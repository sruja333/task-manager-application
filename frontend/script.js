const listEl = document.getElementById("list");
const formEl = document.getElementById("task-form");
const titleEl = document.getElementById("title");
const categoryEl = document.getElementById("category");
const deadlineEl = document.getElementById("deadline");

const API = "http://localhost:5000/tasks";

async function loadTasks() {
  const res = await fetch(API);
  const tasks = await res.json();
  render(tasks);
}

function render(tasks) {
  listEl.innerHTML = "";

  if (!tasks.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No tasks yet. Add one!";
    listEl.appendChild(p);
    return;
  }

  // Group tasks by category
  const grouped = {};
  for (const t of tasks) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }

  // Render category sections
  for (const [cat, catTasks] of Object.entries(grouped)) {
    const section = document.createElement("div");
    section.className = "category-section";

    const h3 = document.createElement("h3");
    h3.textContent = cat;
    section.appendChild(h3);

    const ul = document.createElement("ul");
    for (const t of catTasks) {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.className = "task-title";
      span.textContent = t.title;

      if (t.deadline) {
        const deadlineSpan = document.createElement("span");
        deadlineSpan.className = "task-deadline";
        deadlineSpan.textContent = ` (Deadline: ${new Date(
          t.deadline
        ).toLocaleDateString()})`;
        span.appendChild(deadlineSpan);
      }

      const del = document.createElement("button");
      del.className = "icon-btn";
      del.textContent = "Delete";
      del.onclick = async () => {
        await fetch(`${API}/${t.id}`, { method: "DELETE" });
        loadTasks();
      };

      li.appendChild(span);
      li.appendChild(del);
      ul.appendChild(li);
    }

    section.appendChild(ul);
    listEl.appendChild(section);
  }
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleEl.value.trim();
  const category = categoryEl.value.trim();
  const deadline = deadlineEl.value.trim() || null;
  if (!title || !category) return;

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, category, deadline }),
  });

  titleEl.value = "";
  deadlineEl.value = "";
  loadTasks();
});

loadTasks();
