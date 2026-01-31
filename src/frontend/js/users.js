// src/frontend/js/users.js
document.addEventListener('DOMContentLoaded', () => {
  loadStudents();

  const form = document.getElementById('student-form');
  if (form) {
    form.addEventListener('submit', addStudent);
  }
});

async function loadStudents() {
  try {
    const res = await fetch('/api/students');
    const data = await res.json();

    if (!res.ok) {
      console.error('GET /api/students error:', data);
      alert(data.message || 'Error loading students');
      return;
    }

    displayStudents(data);
  } catch (err) {
    console.error('Error loading students:', err);
    alert('Error loading students');
  }
}

function displayStudents(students) {
  const tbody = document.querySelector('#student-list tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  students.forEach((s) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.class)}</td>
      <td>
        <button data-id="${s.id}" class="delete-btn">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // delete handlers
  tbody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Delete this student?')) return;
      await deleteStudent(id);
    });
  });
}

async function addStudent(e) {
  e.preventDefault();

  const nameEl = document.getElementById('student-name');
  const classEl = document.getElementById('student-class');

  const name = (nameEl?.value || '').trim();
  const studentClass = (classEl?.value || '').trim();

  if (!name || !studentClass) {
    alert('Fill name and class');
    return;
  }

  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, class: studentClass }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('POST /api/students error:', data);
    alert(data.message || 'Error adding student');
    return;
  }

  e.target.reset();
  loadStudents();
}

async function deleteStudent(id) {
  const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('DELETE /api/students/:id error:', data);
    alert(data.message || 'Error deleting student');
    return;
  }
  loadStudents();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
