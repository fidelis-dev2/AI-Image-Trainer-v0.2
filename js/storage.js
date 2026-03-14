const STORAGE_KEYS = {
  users: 'poultryvision_ai_users',
  currentUser: 'poultryvision_ai_current_user',
  trainingRuns: 'poultryvision_ai_training_runs',
  predictions: 'poultryvision_ai_predictions',
  settings: 'poultryvision_ai_settings'
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function bootstrapData() {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    writeJSON(STORAGE_KEYS.users, window.APP_SEED.users);
  }
  if (!localStorage.getItem(STORAGE_KEYS.trainingRuns)) {
    writeJSON(STORAGE_KEYS.trainingRuns, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.predictions)) {
    writeJSON(STORAGE_KEYS.predictions, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.settings)) {
    writeJSON(STORAGE_KEYS.settings, {
      appName: window.APP_SEED.appName,
      classes: window.APP_SEED.classes
    });
  }
}

function uid(prefix = 'ID') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
}

function nowString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
