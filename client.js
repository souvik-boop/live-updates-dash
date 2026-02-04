/**
 * Simple client library for posting updates to the dashboard
 * Usage:
 * 
 * const dash = require('./path/to/client');
 * 
 * const task = dash.createTask('my-task', 'Task Name');
 * task.setProgress(50, 100);
 * task.log('Processing item 50/100');
 * task.complete('Done! Processed 100 items');
 */

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3737';

class DashboardTask {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async _post(endpoint, data) {
    try {
      const response = await fetch(`${DASHBOARD_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (err) {
      console.error(`Dashboard update failed: ${err.message}`);
    }
  }

  async setProgress(current, total) {
    return this._post(`/api/task/${this.id}`, {
      progress: current,
      total: total
    });
  }

  async log(message, level = 'info') {
    return this._post(`/api/task/${this.id}/log`, {
      message,
      level
    });
  }

  async complete(summary) {
    return this._post(`/api/task/${this.id}/complete`, { summary });
  }

  async fail(error) {
    return this._post(`/api/task/${this.id}/fail`, { error });
  }
}

function createTask(id, name) {
  const task = new DashboardTask(id, name);
  
  // Initialize task
  fetch(`${DASHBOARD_URL}/api/task/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).catch(err => {
    console.error(`Failed to create task: ${err.message}`);
  });
  
  return task;
}

module.exports = {
  createTask,
  DASHBOARD_URL
};
