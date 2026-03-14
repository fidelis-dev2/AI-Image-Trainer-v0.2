function getUsers() {
  return readJSON(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  writeJSON(STORAGE_KEYS.users, users);
}

function getCurrentUser() {
  return readJSON(STORAGE_KEYS.currentUser, null);
}

function setCurrentUser(user) {
  writeJSON(STORAGE_KEYS.currentUser, user);
}

function requireAuth(roles = []) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  if (roles.length && !roles.includes(user.role)) {
    Swal.fire({ icon: 'warning', title: 'Access denied', text: 'Huna ruhusa ya kufungua ukurasa huu.' })
      .then(() => window.location.href = 'dashboard.html');
    return null;
  }
  return user;
}

function login(username, password) {
  const users = getUsers();
  const found = users.find(u => (u.username === username || u.email === username) && u.password === password);
  if (!found) return { ok: false, message: 'Username au password si sahihi.' };
  if (found.status !== 'active') return { ok: false, message: 'Akaunti yako haijawezeshwa.' };

  found.lastLogin = nowString();
  saveUsers(users);
  setCurrentUser(found);
  return { ok: true, user: found };
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  window.location.href = 'index.html';
}

function registerUser(payload) {
  const users = getUsers();
  const exists = users.some(u => u.username === payload.username || u.email === payload.email);
  if (exists) return { ok: false, message: 'Username au email tayari ipo.' };

  const user = {
    id: uid('U'),
    fullName: payload.fullName,
    email: payload.email,
    username: payload.username,
    password: payload.password,
    role: payload.role || 'viewer',
    status: 'active',
    createdAt: nowString(),
    lastLogin: null
  };
  users.push(user);
  saveUsers(users);
  return { ok: true, user };
}

function updateUserStatus(userId, status) {
  const users = getUsers().map(u => u.id === userId ? { ...u, status } : u);
  saveUsers(users);
}

function updateUserRole(userId, role) {
  const users = getUsers().map(u => u.id === userId ? { ...u, role } : u);
  saveUsers(users);
}

function deleteUser(userId) {
  const users = getUsers().filter(u => u.id !== userId);
  saveUsers(users);
}
