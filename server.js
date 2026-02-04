const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active tasks
const tasks = new Map();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// WebSocket connection
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send current tasks to new client
  ws.send(JSON.stringify({
    type: 'init',
    tasks: Array.from(tasks.values())
  }));
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// API: Create or update task
app.post('/api/task/:id', (req, res) => {
  const { id } = req.params;
  const update = req.body;
  
  let task = tasks.get(id);
  
  if (!task) {
    // New task
    task = {
      id,
      name: update.name || id,
      status: 'running',
      progress: 0,
      total: 0,
      logs: [],
      startTime: Date.now(),
      ...update
    };
    tasks.set(id, task);
  } else {
    // Update existing task
    Object.assign(task, update);
    task.updatedTime = Date.now();
  }
  
  // Broadcast update
  broadcast({ type: 'task-update', task });
  
  res.json({ ok: true, task });
});

// API: Add log to task
app.post('/api/task/:id/log', (req, res) => {
  const { id } = req.params;
  const { message, level = 'info' } = req.body;
  
  const task = tasks.get(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const logEntry = {
    message,
    level,
    timestamp: Date.now()
  };
  
  task.logs.push(logEntry);
  
  // Keep only last 100 logs
  if (task.logs.length > 100) {
    task.logs = task.logs.slice(-100);
  }
  
  task.updatedTime = Date.now();
  
  broadcast({ type: 'task-log', taskId: id, log: logEntry });
  
  res.json({ ok: true });
});

// API: Complete task
app.post('/api/task/:id/complete', (req, res) => {
  const { id } = req.params;
  const { summary } = req.body;
  
  const task = tasks.get(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  task.status = 'complete';
  task.endTime = Date.now();
  task.summary = summary;
  
  broadcast({ type: 'task-update', task });
  
  res.json({ ok: true, task });
});

// API: Fail task
app.post('/api/task/:id/fail', (req, res) => {
  const { id } = req.params;
  const { error } = req.body;
  
  const task = tasks.get(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  task.status = 'failed';
  task.endTime = Date.now();
  task.error = error;
  
  broadcast({ type: 'task-update', task });
  
  res.json({ ok: true, task });
});

// API: Clear completed tasks
app.delete('/api/tasks/clear', (req, res) => {
  const cleared = [];
  
  for (const [id, task] of tasks.entries()) {
    if (task.status === 'complete' || task.status === 'failed') {
      tasks.delete(id);
      cleared.push(id);
    }
  }
  
  broadcast({ type: 'tasks-cleared', ids: cleared });
  
  res.json({ ok: true, cleared: cleared.length });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    tasks: tasks.size,
    clients: wss.clients.size
  });
});

const PORT = process.env.PORT || 3737;
server.listen(PORT, () => {
  console.log(`🚀 Live Updates Dashboard running at http://localhost:${PORT}`);
  console.log(`📊 WebSocket connections: 0`);
  console.log(`📋 Active tasks: 0`);
});
