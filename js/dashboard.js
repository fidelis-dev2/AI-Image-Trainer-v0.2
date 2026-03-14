document.addEventListener('DOMContentLoaded', () => {
  bootstrapData();
  const user = requireAuth();
  if (!user) return;
  renderShell('dashboard');

  const users = getUsers();
  const runs = getTrainingRuns();
  const preds = getPredictions();
  const activeUsers = users.filter(u => u.status === 'active').length;
  const latestRun = runs[0]?.accuracy ? `${(runs[0].accuracy * 100).toFixed(1)}%` : '0%';

  document.getElementById('pageContent').innerHTML = `
    <div class="row g-4 mb-4">
      ${statCard('Registered Users', users.length, 'bi-people-fill')}
      ${statCard('Active Users', activeUsers, 'bi-person-check-fill', 'accent-card')}
      ${statCard('Training Sessions', runs.length, 'bi-cpu-fill')}
      ${statCard('Latest Accuracy', latestRun, 'bi-graph-up-arrow', 'success-card')}
    </div>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pt-4 px-4">
            <h5 class="mb-1">System overview</h5>
            <p class="text-muted mb-0">Muonekano mwepesi wa mfumo wa AI, login, users, training na predictions.</p>
          </div>
          <div class="card-body px-4">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="feature-box">
                  <i class="bi bi-shield-lock"></i>
                  <h6>Secure Login</h6>
                  <p>Admin, analyst na viewer roles zimetenganishwa kwa local JSON storage.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="feature-box">
                  <i class="bi bi-diagram-3"></i>
                  <h6>Lightweight JSON</h6>
                  <p>Hakuna backend nzito. Data yote inabebwa na browser storage kwa speed nzuri.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="feature-box">
                  <i class="bi bi-stars"></i>
                  <h6>Bootstrap + SweetAlert2</h6>
                  <p>UI ya kisasa, maelezo wazi, cards nzuri, alerts smart na dashboard safi.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="feature-box">
                  <i class="bi bi-clipboard-data"></i>
                  <h6>Modern dashboard feel</h6>
                  <p>Sidebar, stats, report cards na control center inayofanana na admin dashboard nzuri.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pt-4 px-4">
            <h5 class="mb-1">Recent predictions</h5>
            <p class="text-muted mb-0">Matokeo ya mwisho yaliyohifadhiwa.</p>
          </div>
          <div class="card-body px-4">
            <div class="list-group list-group-flush">
              ${preds.slice(0, 5).map(p => `
                <div class="list-group-item px-0">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong>${p.label}</strong>
                    <span class="badge rounded-pill text-bg-light">${(p.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <small class="text-muted d-block">By ${p.by} • ${p.date}</small>
                </div>
              `).join('') || '<div class="text-muted">No prediction history yet.</div>'}
            </div>
          </div>
        </div>
      </div>
    </div>`;
});
