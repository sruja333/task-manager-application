import React, { useState, useEffect } from "react";

// Default categories
const defaultCategories = [
  { value: "Work", color: "#ff8a00" },
  { value: "Study", color: "#e24242ff" },
  { value: "Personal", color: "#9b63e9ff" }
];

function App() {
  const [tasks, setTasks] = useState([]);
  const [finishedTasks, setFinishedTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState("Work");
  const [filter, setFilter] = useState("All");
  const [categories, setCategories] = useState(defaultCategories);
  const [newCategory, setNewCategory] = useState("");
  const [showDeadlineInput, setShowDeadlineInput] = useState({});
  const [deadlines, setDeadlines] = useState({}); 
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [showFinishedTasks, setShowFinishedTasks] = useState(false);
  const [frostyState, setFrostyState] = useState("sleep");
  const [frostyMessage, setFrostyMessage] = useState("Frosty the penguin is asleep. Give him a task!");
  const [showConfetti, setShowConfetti] = useState(false);

  const API_URL = "http://localhost:5000/tasks";

  // Load tasks and deadlines on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const res = await fetch(API_URL);
      const activeTasks = await res.json();
      
      // Fetch completed tasks separately
      const completedRes = await fetch(`${API_URL}/completed`);
      const completedTasks = await completedRes.json();
      
      setTasks(activeTasks);
      setFinishedTasks(completedTasks);
      
      // Extract deadlines from all tasks
      const allTasks = [...activeTasks, ...completedTasks];
      const deadlinesObj = {};
      allTasks.forEach(task => {
        if (task.deadline) {
          deadlinesObj[task.id] = task.deadline;
        }
      });
      setDeadlines(deadlinesObj);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  async function addTask() {
    if (!newTask.trim()) return;
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask, category, completed: false })
      });
      setNewTask("");
      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  }

  async function deleteTask(id, isFinished = false) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  async function updateTaskDeadline(id, deadline) {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline })
      });
      fetchTasks();
    } catch (error) {
      console.error("Error updating deadline:", error);
    }
  }

  async function markTaskAsDone(id) {
  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        completed: true,
        completedAt: new Date().toISOString()
      })
    });
    
    // Show confetti and update Frosty's state
    setShowConfetti(true);
    setFrostyState("stand");
    setFrostyMessage("YAYY! You did it");
    
    // Reset after 2 seconds
    setTimeout(() => {
      setShowConfetti(false);
      fetchTasks();
    }, 2000);
    
  } catch (error) {
    console.error("Error marking task as done:", error);
  }
}

  async function clearFinishedTasks() {
    try {
      // Delete all finished tasks
      for (const task of finishedTasks) {
        await fetch(`${API_URL}/${task.id}`, { method: "DELETE" });
      }
      setFinishedTasks([]);
    } catch (error) {
      console.error("Error clearing finished tasks:", error);
    }
  }

  function handleAddCategory(e) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name || categories.some(cat => cat.value.toLowerCase() === name.toLowerCase())) return;
    // Generate a random color for the new category
    const color = "#" + Math.floor(Math.random()*16777215).toString(16);
    setCategories([...categories, { value: name, color }]);
    setNewCategory("");
  }

  function handleDeleteCategory(catValue) {
    if (defaultCategories.some(cat => cat.value === catValue)) return;
    setCategories(categories.filter(cat => cat.value !== catValue));
    if (filter === catValue) setFilter("All");
    if (category === catValue) setCategory("Work");
  }

  // Set deadline for a task
  function handleSetDeadline(id) {
    setShowDeadlineInput(prev => ({ ...prev, [id]: true }));
  }

  function handleDeadlineChange(id, value) {
    updateTaskDeadline(id, value);
    setShowDeadlineInput(prev => ({ ...prev, [id]: false }));
  }

  // Edit existing deadline
  function handleEditDeadline(id) {
    setEditingDeadline(id);
  }

  function handleUpdateDeadline(id, value) {
    updateTaskDeadline(id, value);
    setEditingDeadline(null);
  }

  // Check if deadline is exceeded
  function isDeadlineExceeded(id) {
    const deadline = deadlines[id];
    if (!deadline) return false;
    return new Date() > new Date(deadline);
  }

  const filteredTasks = filter === "All"
    ? tasks
    : tasks.filter(task => task.category === filter);
    
    useEffect(() => {
  // Check for exceeded deadlines
  const hasExceededDeadline = tasks.some(task => {
    const deadline = deadlines[task.id];
    return deadline && new Date() > new Date(deadline);
  });

  if (tasks.length === 0) {
    setFrostyState("sleep");
    setFrostyMessage("Frosty the penguin is asleep. Give him a task!");
  } else if (hasExceededDeadline) {
    setFrostyState("sit");
    setFrostyMessage("You've exceeded a deadline :(");
  } else {
    setFrostyState("normal");
    setFrostyMessage(`Only ${tasks.length} task${tasks.length !== 1 ? 's' : ''} to go!`);
  }
}, [tasks, deadlines]);

  return (
  <div className="app-container" style={{
    background: "none", 
    minHeight: "100vh",                                  
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
    paddingLeft: 0,
  }}>
    {/* Confetti Effect */}
    {showConfetti && (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1000
      }}>
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-10px",
              left: `${Math.random() * 100}%`,
              width: "10px",
              height: "10px",
              background: `hsl(${Math.random() * 360}, 100%, 50%)`,
              borderRadius: "50%",
              animation: `fall ${Math.random() * 2 + 1}s linear forwards`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
        <style>
          {`
            @keyframes fall {
              to {
                transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                opacity: 0;
              }
            }
          `}
        </style>
      </div>
    )}
    
    <div style={{
      background: "rgba(47, 49, 62, 0.92)",
      borderRadius: "28px",
      boxShadow: "0 8px 32px rgba(102,126,234,0.18)",
      padding: "48px",
      minWidth: "480px",
      maxWidth: "600px",
      width: "100%",
      minHeight: "480px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <h1 style={{ marginBottom: "32px", fontSize: "2.2rem", color: "#ffffffff", textAlign: "center" }}>Task Manager</h1>
      
      {/* Toggle between active and finished tasks */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "12px" }}>
        <button
          onClick={() => setShowFinishedTasks(false)}
          style={{
            background: !showFinishedTasks ? "#6f88f9ff" : "#23243a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => e.target.style.opacity = 0.8}
          onMouseOut={(e) => e.target.style.opacity = 1}
        >
          Active Tasks
        </button>
        <button
          onClick={() => setShowFinishedTasks(true)}
          style={{
            background: showFinishedTasks ? "#5141a5ff" : "#23243a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => e.target.style.opacity = 0.8}
          onMouseOut={(e) => e.target.style.opacity = 1}
        >
          Finished Tasks ({finishedTasks.length})
        </button>
      </div>

      
      {!showFinishedTasks ? (
        <>
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center", width: "100%", gap: "10px" }}>
            <input
              type="text"
              placeholder="Enter task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              style={{
                padding: "14px",
                width: "50%",
                borderRadius: "10px",
                border: "none",
                background: "#383955ff",
                color: "#fff",
                fontSize: "1rem"
              }}
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "20px",
                border: "#fff",
                background: "linear-gradient(90deg, #8eb8f2ff 0%, #418bdfff 100%)",
                color: "#000",
                fontSize: "1rem"
              }}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.value}</option>
              ))}
            </select>
            <button onClick={addTask} style={{
              padding: "14px 22px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(90deg, #0a529eff 0%, #7094d3ff 100%)",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1rem"
            }}>
              Add
            </button>
          </div>
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} style={{ marginBottom: "18px", display: "flex", gap: "10px", width: "100%", justifyContent: "center" }}>
            <input
              type="text"
              placeholder="New category"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: "#393b56ff",
                color: "#fff",
                fontSize: "1rem",
                width: "50%"
              }}
            />
            <button type="submit" style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(90deg, #4983d5ff 0%, #3ab59eff 100%)",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1rem"
            }}>
              Add Category
            </button>
          </form>
          {/* Filter Buttons */}
          <div style={{ marginBottom: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => setFilter("All")}
              style={{
                background: filter === "All" ? "#fff" : "#23243a",
                color: filter === "All" ? "#23243a" : "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "6px 14px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >All</button>
            {categories.map(cat => (
              <span key={cat.value} style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => setFilter(cat.value)}
                  style={{
                    background: filter === cat.value ? cat.color : "#23243a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    marginRight: defaultCategories.some(def => def.value === cat.value) ? 0 : 4
                  }}
                >{cat.value}</button>
                {/* Show delete button only for custom categories */}
                {!defaultCategories.some(def => def.value === cat.value) && (
                  <button
                    onClick={() => handleDeleteCategory(cat.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      marginLeft: "-6px"
                    }}
                    title="Delete category"
                  >🗑️</button>
                )}
              </span>
            ))}
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, width: "100%", overflowY: "auto", maxHeight: "400px" }}>
            {filteredTasks.length === 0 && (
              <li style={{
                color: "#aaa",
                textAlign: "center",
                padding: "16px 0",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "10px"
              }}>No tasks yet!</li>
            )}
            {filteredTasks.map((task) => {
              const cat = categories.find(c => c.value === task.category);
              const deadline = deadlines[task.id];
              const overdue = isDeadlineExceeded(task.id);
              return (
                <li key={task.id} style={{
                  display: "flex",
                  flexDirection: "column",
                  background: overdue ? "#b91c1c" : "rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "12px",
                  boxShadow: "0 2px 8px rgba(102,126,234,0.10)"
                }}>
                  {/* Task row with better spacing */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    marginBottom: "12px"
                  }}>
                    {/* Task title aligned to the left */}
                    <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                      <span style={{ 
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                        color: "#fff",
                        paddingRight: "16px",
                        wordBreak: "break-word",
                        marginLeft: "8px"
                      }}>
                        {task.title}
                      </span>
                    </div>
                    
                    {/* Category and Delete button aligned to the right */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px",
                      flexShrink: 0
                    }}>
                      <span style={{
                        background: cat?.color,
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        whiteSpace: "nowrap"
                      }}>
                        {task.category}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          background: "rgba(2, 181, 246, 1)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          whiteSpace: "nowrap"
                        }}
                        title="Delete task"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Deadline section */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    paddingTop: "8px",
                    borderTop: "1px solid rgba(255,255,255,0.1)"
                  }}>
                    {!deadline && !showDeadlineInput[task.id] && (
                      <button
                        onClick={() => handleSetDeadline(task.id)}
                        style={{
                          background: "#2865f3ff",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "0.9rem"
                        }}
                      >
                        Set Deadline
                      </button>
                    )}
                    {showDeadlineInput[task.id] && (
                      <input
                        type="datetime-local"
                        onChange={e => handleDeadlineChange(task.id, e.target.value)}
                        style={{
                          padding: "8px",
                          borderRadius: "8px",
                          border: "none",
                          fontSize: "0.9rem",
                          width: "100%",
                          maxWidth: "220px"
                        }}
                      />
                    )}
                    {deadline && editingDeadline !== task.id && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        <span style={{
                          color: overdue ? "#ff6b6b" : "#a5d8ff",
                          fontWeight: "bold",
                          fontSize: "0.9rem",
                          flex: 1
                        }}>
                          Deadline: {new Date(deadline).toLocaleString()}
                          {overdue && " (Overdue)"}
                        </span>
                        <button
                          onClick={() => handleEditDeadline(task.id)}
                          style={{
                            background: "#2865f3ff",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            whiteSpace: "nowrap"
                          }}
                          title="Edit deadline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                    {editingDeadline === task.id && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        <input
                          type="datetime-local"
                          defaultValue={deadline ? new Date(deadline).toISOString().slice(0, 16) : ""}
                          onChange={e => handleUpdateDeadline(task.id, e.target.value)}
                          style={{
                            padding: "8px",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "0.9rem",
                            flex: 1
                          }}
                        />
                        <button
                          onClick={() => setEditingDeadline(null)}
                          style={{
                            background: "#6c757d",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Cancel
                        </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Mark as Done button */}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "flex-end",
                      marginTop: "12px"
                    }}>
                      <button
                        onClick={() => markTaskAsDone(task.id)}
                        style={{
                          background: "#4CAF50",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "0.9rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        title="Mark as done"
                      >
                        <span>✓</span> Mark as Done
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          /* Finished Tasks Section */
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ color: "#fff", margin: 0 }}>Completed Tasks</h2>
              {finishedTasks.length > 0 && (
                <button
                  onClick={clearFinishedTasks}
                  style={{
                    background: "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem"
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
            <ul style={{ listStyle: "none", padding: "0", margin: "0", width: "100%" }}>
              {finishedTasks.length === 0 && (
                <li style={{
                  color: "#aaa",
                  textAlign: "center",
                  padding: "16px 0",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "10px"
                }}>No finished tasks yet!</li>
              )}
              {finishedTasks.map((task) => {
                const cat = categories.find(c => c.value === task.category);
                return (
                  <li key={task.id} style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "rgba(76, 175, 80, 0.2)",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "12px",
                    boxShadow: "0 2px 8px rgba(102,126,234,0.10)"
                  }}>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between"
                    }}>
                      {/* Task title aligned to the left */}
                      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <span style={{ 
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                          color: "#fff",
                          paddingRight: "16px",
                          wordBreak: "break-word",
                          textDecoration: "line-through",
                          opacity: 0.7,
                          marginLeft: "8px"
                        }}>
                          {task.title}
                        </span>
                      </div>
                      
                      {/* Category and Delete button aligned to the right */}
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px",
                        flexShrink: 0
                      }}>
                        <span style={{
                          background: cat?.color,
                          color: "#fff",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                          opacity: 0.7
                        }}>
                          {task.category}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id, true)}
                          style={{
                            background: "linear-gradient(90deg, #e52e71 0%, #ff8a00 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            whiteSpace: "nowrap"
                          }}
                          title="Delete task"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {task.completedAt && (
                      <div style={{ 
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid rgba(255,255,255,0.1)"
                      }}>
                        <span style={{
                          color: "#a5d8ff",
                          fontWeight: "bold",
                          fontSize: "0.9rem"
                        }}>
                          Completed on: {new Date(task.completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
{/* Frosty the Penguin with speech bubble */}
<div style={{
  position: "relative",
  left: "600px",
  top: "100px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  zIndex: 10,
  transition: "all 0.5s ease"
}}>
  {/* Speech Bubble */}
  <div style={{
    background: "rgba(154, 212, 240, 1)",
    color: "black",
    fontFamily: "comic sans ms, cursive, sans-serif",
    fontSize: "1.5rem",
    padding: "12px 16px",
    borderRadius: "20px",
    marginBottom: "10px",
    maxWidth: "200px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    position: "relative",
    opacity: frostyMessage ? 1 : 0,
    transition: "opacity 0.5s ease"
  }}>
    {frostyMessage}
    <div style={{
      position: "absolute",
      bottom: "-10px",
      right: "30px",
      width: "0",
      height: "0",
      borderLeft: "10px solid transparent",
      borderRight: "10px solid transparent",
      borderTop: "10px solid rgba(154, 212, 240, 1)"
    }} />
  </div>
  
  {/* Penguin Image */}
  <img
    src={`${frostyState}.png`}
    alt="Frosty the Penguin"
    style={{
      width: "265px",
      height: "265px",
      objectFit: "contain",
      userSelect: "none",
      background: "transparent",
      borderRadius: "16px",
      transition: "all 0.5s ease"
    }}
  />
</div>
</div>
);
}

export default App;