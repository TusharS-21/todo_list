const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const STORAGE_KEY = 'todo-list-data';

let todos = [];

function renderTodos() {
  todoList.innerHTML = '';

  if (todos.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'no-todos';
    emptyMessage.textContent = 'No tasks yet. Add one above to get started.';
    todoList.appendChild(emptyMessage);
    return;
  }

  todos.forEach((todo, index) => {
    const item = document.createElement('li');
    item.className = `todo-item${todo.completed ? ' completed' : ''}`;

    const label = document.createElement('label');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.dataset.action = 'toggle';
    checkbox.dataset.id = todo.id;

    const text = document.createElement('span');
    text.textContent = todo.text;

    label.appendChild(checkbox);
    label.appendChild(text);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.dataset.action = 'remove';
    removeButton.dataset.id = todo.id;

    item.appendChild(label);
    item.appendChild(removeButton);
    todoList.appendChild(item);
  });
}

async function loadTodos() {
  try {
    const response = await fetch('/api/todos');
    if (response.ok) {
      todos = await response.json();
      saveLocalTodos(todos);
      renderTodos();
      return;
    }
    console.warn('Server returned an error, using local todo data.');
  } catch (error) {
    console.warn('Server not available, loading local todos.', error);
  }

  todos = loadLocalTodos();
  renderTodos();
}

async function createTodo(text) {
  const todo = {
    id: Date.now().toString(),
    text,
    completed: false,
  };

  try {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      const savedTodo = await response.json();
      todos.push(savedTodo);
    } else {
      console.warn('Server create failed, saving locally.');
      todos.push(todo);
    }
  } catch (error) {
    console.warn('Server not available, saving locally.', error);
    todos.push(todo);
  }

  saveLocalTodos(todos);
  renderTodos();
}

async function updateTodo(id, updates) {
  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      const updated = await response.json();
      todos = todos.map(todo => (todo.id === updated.id ? updated : todo));
    } else {
      console.warn('Server update failed, updating local copy.');
      todos = todos.map(todo => (todo.id === id ? { ...todo, ...updates } : todo));
    }
  } catch (error) {
    console.warn('Server not available, updating local copy.', error);
    todos = todos.map(todo => (todo.id === id ? { ...todo, ...updates } : todo));
  }

  saveLocalTodos(todos);
  renderTodos();
}

async function deleteTodo(id) {
  try {
    const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      console.warn('Server delete failed, removing locally.');
    }
  } catch (error) {
    console.warn('Server not available, removing locally.', error);
  }

  todos = todos.filter(todo => todo.id !== id);
  saveLocalTodos(todos);
  renderTodos();
}

function loadLocalTodos() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn('Unable to read local todos.', error);
    return [];
  }
}

function saveLocalTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.warn('Unable to save local todos.', error);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const value = input.value.trim();
  if (!value) return;

  createTodo(value);
  input.value = '';
  input.focus();
});

todoList.addEventListener('click', event => {
  const checkbox = event.target.closest('input[type="checkbox"]');
  if (checkbox) {
    const id = checkbox.dataset.id;
    updateTodo(id, { completed: checkbox.checked });
    return;
  }

  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === 'remove') deleteTodo(id);
});

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

loadTodos();
