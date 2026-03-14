document.addEventListener('DOMContentLoaded', () => {
  bootstrapData();
  const user = requireAuth();
  if (!user) return;
  renderShell('reports');

  const runs = getTrainingRuns();
  const preds = getPredictions();
  const labels = {};
  preds.forEach(p => labels[p.label] = (labels[p.label] || 0) + 1);

  document.getElementById('pageContent').innerHTML = `
    <div class="row g-4">
      <div class="col-xl-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pt-4 px-4">
            <h5 class="mb-1">Training history</h5>
            <p class="text-muted mb-0">Mizunguko ya model training iliyofanyika.</p>
          </div>
          <div class="card-body px-4 pb-4 table-responsive">
            <table class="table align-middle">
              <thead><tr><th>Date</th><th>Epochs</th><th>Samples</th><th>Accuracy</th><th>By</th></tr></thead>
              <tbody>
                ${runs.map(r => `<tr><td>${r.date}</td><td>${r.epochs}</td><td>${r.samples}</td><td>${(r.accuracy * 100).toFixed(1)}%</td><td>${r.by}</td></tr>`).join('') || '<tr><td colspan="5" class="text-muted">No training history.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-xl-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pt-4 px-4">
            <h5 class="mb-1">Prediction summary</h5>
            <p class="text-muted mb-0">Class distribution ya predictions zilizohifadhiwa.</p>
          </div>
          <div class="card-body px-4 pb-4">
            ${Object.keys(labels).map(k => `
              <div class="mb-3">
                <div class="d-flex justify-content-between small mb-1"><span>${k}</span><span>${labels[k]}</span></div>
                <div class="progress" role="progressbar"><div class="progress-bar" style="width:${(labels[k] / Math.max(preds.length,1))*100}%"></div></div>
              </div>`).join('') || '<div class="text-muted">No prediction summary available.</div>'}
          </div>
        </div>
      </div>
    </div>`;
});
