function renderShell(activePage) {
  const user = getCurrentUser();
  if (!user) return;
  const shell = document.getElementById('appShell');
  if (!shell) return;

  shell.innerHTML = `
    <div class="sidebar shadow-lg">
      <div>
        <div class="brand-box">
          <div class="brand-icon">P</div>
          <div>
            <h5 class="mb-0">PoultryVision</h5>
            <small class="text-white-50">Smart Poultry Classifier</small>
          </div>
        </div>
        <div class="profile-mini mt-4">
          <div class="avatar-circle">${user.fullName.charAt(0).toUpperCase()}</div>
          <div>
            <div class="fw-semibold">${user.fullName}</div>
            <small class="text-white-50 text-capitalize">${user.role}</small>
          </div>
        </div>
        <div class="menu-list mt-4">
          <a href="dashboard.html" class="menu-link ${activePage === 'dashboard' ? 'active' : ''}"><i class="bi bi-grid"></i><span>Dashboard</span></a>
          <a href="train.html" class="menu-link ${activePage === 'train' ? 'active' : ''}"><i class="bi bi-cpu"></i><span>Train Model</span></a>
          <a href="predict.html" class="menu-link ${activePage === 'predict' ? 'active' : ''}"><i class="bi bi-search"></i><span>Predict</span></a>
          <a href="reports.html" class="menu-link ${activePage === 'reports' ? 'active' : ''}"><i class="bi bi-bar-chart"></i><span>Reports</span></a>
          ${user.role === 'admin' ? `<a href="users.html" class="menu-link ${activePage === 'users' ? 'active' : ''}"><i class="bi bi-people"></i><span>User Accounts</span></a>` : ''}
        </div>
      </div>
      <button class="btn btn-light w-100 rounded-pill" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Logout</button>
    </div>
    <div class="main-panel">
      <div class="topbar card border-0 shadow-sm mb-4">
        <div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div class="text-muted small">Welcome back</div>
            <h4 class="mb-0 page-title">${document.body.dataset.title || 'Dashboard'}</h4>
          </div>
          <div class="d-flex align-items-center gap-3">
            <span class="badge text-bg-primary-subtle text-primary-emphasis px-3 py-2 rounded-pill text-capitalize">${user.role}</span>
            <span class="text-muted small">Last login: ${user.lastLogin || 'First login'}</span>
          </div>
        </div>
      </div>
      <div id="pageContent"></div>
    </div>
  `;
  document.getElementById('logoutBtn').addEventListener('click', () => {
    Swal.fire({
      icon: 'question',
      title: 'Logout?',
      text: 'Unataka kutoka kwenye mfumo sasa?',
      showCancelButton: true,
      confirmButtonText: 'Ndiyo, toka',
      cancelButtonText: 'Ghairi'
    }).then(res => { if (res.isConfirmed) logout(); });
  });
}

function statCard(title, value, icon, extraClass = '') {
  return `
  <div class="col-md-6 col-xl-3">
    <div class="card stat-card border-0 shadow-sm ${extraClass}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="text-muted small mb-2">${title}</div>
            <h3 class="mb-0">${value}</h3>
          </div>
          <div class="stat-icon"><i class="bi ${icon}"></i></div>
        </div>
      </div>
    </div>
  </div>`;
}

function getTrainingRuns() { return readJSON(STORAGE_KEYS.trainingRuns, []); }
function saveTrainingRuns(data) { writeJSON(STORAGE_KEYS.trainingRuns, data); }
function getPredictions() { return readJSON(STORAGE_KEYS.predictions, []); }
function savePredictions(data) { writeJSON(STORAGE_KEYS.predictions, data); }
