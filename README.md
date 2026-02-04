# Live Updates Dashboard

Real-time dashboard for tracking background tasks and live progress.

## Quick Start

```bash
npm install
npm start
```

Then open: http://localhost:3737

## Usage in Scripts

```javascript
const dash = require('../live-updates-dash/client');

const task = dash.createTask('my-task-id', 'My Task Name');

// Update progress
task.setProgress(50, 100);

// Log messages
task.log('Processing item 50/100', 'info');
task.log('Warning: something happened', 'warn');
task.log('Error occurred', 'error');
task.log('Success!', 'success');

// Complete
task.complete('Done! Processed 100 items');

// Or fail
task.fail('Something went wrong');
```

## API

### POST /api/task/:id
Create or update a task

### POST /api/task/:id/log
Add a log entry

### POST /api/task/:id/complete
Mark task as complete

### POST /api/task/:id/fail
Mark task as failed

### DELETE /api/tasks/clear
Clear all completed/failed tasks

## Environment

- `PORT`: Dashboard port (default: 3737)
- `DASHBOARD_URL`: URL for client library (default: http://localhost:3737)
