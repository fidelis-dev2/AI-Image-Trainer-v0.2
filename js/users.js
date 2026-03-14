document.addEventListener('DOMContentLoaded', () => {
  bootstrapData();
  const user = requireAuth(['admin']);
  if (!user) return;
  renderShell('users');

  function draw() {
    const users = getUsers();
    document.getElementById('pageContent').innerHTML = `
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 class="mb-1">User Accounts</h5>
            <p class="text-muted mb-0">Manage admin, analyst and viewer accounts.</p>
          </div>
          <button class="btn btn-primary rounded-pill" id="addUserBtn"><i class="bi bi-person-plus me-2"></i>Create account</button>
        </div>
        <div class="card-body px-4 pb-4">
          <div class="table-responsive">
            <table class="table align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td>
                      <div class="fw-semibold">${u.fullName}</div>
                      <small class="text-muted">${u.email}</small>
                    </td>
                    <td>${u.username}</td>
                    <td>
                      <select class="form-select form-select-sm roleSelect" data-id="${u.id}" ${u.id === user.id ? 'disabled' : ''}>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
                        <option value="analyst" ${u.role === 'analyst' ? 'selected' : ''}>analyst</option>
                        <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>viewer</option>
                      </select>
                    </td>
                    <td><span class="badge ${u.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}">${u.status}</span></td>
                    <td>${u.createdAt}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-warning toggleBtn" data-id="${u.id}" data-status="${u.status}">${u.status === 'active' ? 'Disable' : 'Enable'}</button>
                      ${u.id !== user.id ? `<button class="btn btn-sm btn-outline-danger deleteBtn" data-id="${u.id}">Delete</button>` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    document.getElementById('addUserBtn').onclick = async () => {
      const { value: formValues } = await Swal.fire({
        title: 'Create account',
        html: `
          <input id="swal-name" class="swal2-input" placeholder="Full name">
          <input id="swal-email" class="swal2-input" placeholder="Email">
          <input id="swal-username" class="swal2-input" placeholder="Username">
          <input id="swal-password" class="swal2-input" type="password" placeholder="Password">
          <select id="swal-role" class="swal2-select">
            <option value="viewer">viewer</option>
            <option value="analyst">analyst</option>
            <option value="admin">admin</option>
          </select>`,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => ({
          fullName: document.getElementById('swal-name').value.trim(),
          email: document.getElementById('swal-email').value.trim(),
          username: document.getElementById('swal-username').value.trim(),
          password: document.getElementById('swal-password').value.trim(),
          role: document.getElementById('swal-role').value
        })
      });
      if (!formValues) return;
      if (!formValues.fullName || !formValues.email || !formValues.username || !formValues.password) {
        return Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Jaza taarifa zote kwanza.' });
      }
      const res = registerUser(formValues);
      if (!res.ok) return Swal.fire({ icon: 'error', title: 'Failed', text: res.message });
      Swal.fire({ icon: 'success', title: 'Success', text: 'Akaunti imeundwa vizuri.' });
      draw();
    };

    document.querySelectorAll('.toggleBtn').forEach(btn => btn.onclick = () => {
      const next = btn.dataset.status === 'active' ? 'disabled' : 'active';
      updateUserStatus(btn.dataset.id, next);
      draw();
    });

    document.querySelectorAll('.deleteBtn').forEach(btn => btn.onclick = async () => {
      const res = await Swal.fire({ icon: 'warning', title: 'Delete user?', showCancelButton: true, confirmButtonText: 'Delete' });
      if (!res.isConfirmed) return;
      deleteUser(btn.dataset.id);
      draw();
    });

    document.querySelectorAll('.roleSelect').forEach(sel => sel.onchange = () => {
      updateUserRole(sel.dataset.id, sel.value);
      Swal.fire({ icon: 'success', title: 'Updated', timer: 1200, showConfirmButton: false });
    });
  }

  draw();
});
