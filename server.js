const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function loadTodos() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || [];
  } catch (error) {
    return [];
  }
}

function saveTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf8');
}

app.get('/api/todos', (req, res) => {
  res.json(loadTodos());
});

app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Task text is required.' });
  }

  const todos = loadTodos();
  const newTodo = {
    id: Date.now().toString(),
    text: text.trim(),
    completed: false,
  };

  todos.push(newTodo);
  saveTodos(todos);
  res.status(201).json(newTodo);
});

app.patch('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const todos = loadTodos();
  const index = todos.findIndex(todo => todo.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found.' });
  }

  todos[index] = { ...todos[index], ...updates };
  saveTodos(todos);
  res.json(todos[index]);
});

app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const todos = loadTodos();
  const filtered = todos.filter(todo => todo.id !== id);

  if (filtered.length === todos.length) {
    return res.status(404).json({ error: 'Todo not found.' });
  }

  saveTodos(filtered);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
