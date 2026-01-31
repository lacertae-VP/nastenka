
(() => {
  console.log("✅ DASHBOARD.JS LOADED");

  const $ = (s) => document.querySelector(s);


  const upcomingWrap = $("#upcomingEvents");
  const pastWrap = $("#pastEvents");

  const btnNew = $("#btnNew");
  const btnRefresh = $("#btnRefresh");

  const backdrop = $("#dashBackdrop");
  const btnClose = $("#dashClose");
  const btnClose2 = $("#btnClose2");

  const viewPanel = $("#viewPanel");
  const formPanel = $("#formPanel");

  const mTitle = $("#mTitle");
  const mMeta = $("#mMeta");
  const mDesc = $("#mDesc");
  const mTeachers = $("#mTeachers");
  const mClasses = $("#mClasses");

  const btnEdit = $("#btnEdit");
  const btnDelete = $("#btnDelete");

  const formHeading = $("#formHeading");
  const fTitle = $("#fTitle");
  const fPlace = $("#fPlace");
  const fDate = $("#fDate");
  const fTime = $("#fTime");
  const fDesc = $("#fDesc");
  const fClasses = $("#fClasses");
  const fTeachers = $("#fTeachers");
  const btnSave = $("#btnSave");
  const btnCancel = $("#btnCancel");

  // stav
  let EVENTS = [];
  let TEACHERS = [];
  let CLASSES = []; 
  let selectedId = null;
  let mode = "view"; 

 
  const pad2 = (n) => String(n).padStart(2, "0");
  const normTime = (t) => (t ? String(t).slice(0, 5) : "");

  function toDateTime(ev) {
    const rawDate = (ev.event_date || ev.date || "");
    const datePart = String(rawDate).slice(0, 10); // YYYY-MM-DD
    const timePart = normTime(ev.event_time || ev.time || "");
    const safeTime = timePart ? `${timePart}:00` : "23:59:00";
    return new Date(`${datePart}T${safeTime}`); // local
  }

  function fmtDate(d) {
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  }
  function fmtTime(d) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setVisible(panelName) {
    
    if (panelName === "view") {
      viewPanel.style.display = "block";
      formPanel.classList.remove("show");
      formPanel.style.display = "none";
    } else {
      viewPanel.style.display = "none";
      formPanel.style.display = "block";
      formPanel.classList.add("show");
    }
  }

  function openModal() {
    backdrop.classList.add("show");
  }

  function closeModal() {
    backdrop.classList.remove("show");
    selectedId = null;
    mode = "view";
    setVisible("view");
  }

  function fillSelect(selectEl, items, getValue, getLabel) {
    selectEl.innerHTML = "";
    for (const it of items) {
      const opt = document.createElement("option");
      opt.value = getValue(it);
      opt.textContent = getLabel(it);
      selectEl.appendChild(opt);
    }
  }

  function getSelectedValues(selectEl) {
    return Array.from(selectEl.selectedOptions).map((o) => o.value);
  }

  function setSelectedValues(selectEl, values) {
    const set = new Set(values.map(String));
    for (const opt of selectEl.options) {
      opt.selected = set.has(String(opt.value));
    }
  }

  // API
  async function apiJSON(path, options) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...(options || {}),
    });
    const text = await res.text().catch(() => "");
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!res.ok) {
      const msg = (data && data.message) || (typeof data === "string" ? data : "") || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  const api = {
    events: () => apiJSON("/api/events"),
    eventById: (id) => apiJSON(`/api/events/${id}`),
    teachers: () => apiJSON("/api/teachers"),
    students: () => apiJSON("/api/students"),
    createEvent: (payload) => apiJSON("/api/events", { method: "POST", body: JSON.stringify(payload) }),
    updateEvent: (id, payload) => apiJSON(`/api/events/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    deleteEvent: (id) => apiJSON(`/api/events/${id}`, { method: "DELETE" }),
  };

  // render cards
  function makeCard(ev) {
    const dt = toDateTime(ev);
    const dateText = fmtDate(dt);
    const timeText = normTime(ev.event_time) ? fmtTime(dt) : "";
    const placeText = ev.place ? `• Miesto: ${esc(ev.place)}` : "";
    const timePart = timeText ? `• Čas: ${timeText}` : "";

    const div = document.createElement("div");
    div.className = "event-card";
    div.dataset.eventId = ev.id;

    div.innerHTML = `
      <div class="event-title">${esc(ev.title || "—")}</div>
      <div class="event-meta">
        <span>Dátum: ${dateText}</span>
        ${timePart ? `<span>${timePart}</span>` : ""}
        ${placeText ? `<span>${placeText}</span>` : ""}
      </div>
      ${ev.description ? `<div class="event-desc">${esc(ev.description)}</div>` : ""}
    `;
    return div;
  }

  function renderLists() {
    upcomingWrap.innerHTML = "";
    pastWrap.innerHTML = "";

    const now = new Date();

    const upcoming = [];
    const past = [];

    for (const ev of EVENTS) {
      const dt = toDateTime(ev);
      if (dt.getTime() >= now.getTime()) upcoming.push(ev);
      else past.push(ev);
    }

    upcoming.sort((a, b) => toDateTime(a) - toDateTime(b));
    past.sort((a, b) => toDateTime(b) - toDateTime(a));

    if (!upcoming.length) upcomingWrap.innerHTML = `<div style="opacity:.8">Žiadne nadchádzajúce udalosti.</div>`;
    else upcoming.forEach((ev) => upcomingWrap.appendChild(makeCard(ev)));

    if (!past.length) pastWrap.innerHTML = `<div style="opacity:.8">Žiadne minulé udalosti.</div>`;
    else past.forEach((ev) => pastWrap.appendChild(makeCard(ev)));
  }

  // modal view
  function renderView(evFull) {
    const dt = toDateTime(evFull);
    const dateText = fmtDate(dt);
    const timeText = normTime(evFull.event_time) ? fmtTime(dt) : "—";
    const placeText = evFull.place ? evFull.place : "—";

    mTitle.textContent = evFull.title || "—";
    mMeta.textContent = `Dátum: ${dateText} • Čas: ${timeText} • Miesto: ${placeText}`;
    mDesc.textContent = evFull.description || "—";

    // triedy
    const classNames = Array.isArray(evFull.classes) ? evFull.classes : [];
    
    mClasses.innerHTML = classNames.length
      ? classNames.map((n) => `<li>${esc(n)}</li>`).join("")
      : `<li>—</li>`;

    // ucitelia
    const teachers = Array.isArray(evFull.teachers) ? evFull.teachers : [];
    const teacherNames = teachers
      .map((t) => t.name || t.full_name || `${t.first_name || ""} ${t.last_name || ""}`.trim())
      .filter(Boolean);

    mTeachers.innerHTML = teacherNames.length
      ? teacherNames.map((n) => `<li>${esc(n)}</li>`).join("")
      : `<li>—</li>`;
  }

  async function openEvent(id) {
    selectedId = id;
    mode = "view";
    setVisible("view");
    openModal();

    try {
      const full = await api.eventById(id);
      renderView(full);

      prepareForm(full);
    } catch (e) {
      console.error(e);
      alert("Nepodarilo sa načítať detail udalosti.");
      closeModal();
    }
  }

  
  function prepareForm(evFullOrNull) {

    fillSelect(fTeachers, TEACHERS, (t) => t.id, (t) => t.name || t.full_name || "—");
    fillSelect(fClasses, CLASSES, (c) => c, (c) => c);

    if (!evFullOrNull) {
      formHeading.textContent = "Nová udalosť";
      fTitle.value = "";
      fPlace.value = "";
      fDate.value = "";
      fTime.value = "";
      fDesc.value = "";
      setSelectedValues(fTeachers, []);
      setSelectedValues(fClasses, []);
      return;
    }

    formHeading.textContent = "Upraviť udalosť";
    fTitle.value = evFullOrNull.title || "";
    fPlace.value = evFullOrNull.place || "";
    fDate.value = String(evFullOrNull.event_date || "").slice(0, 10) || "";
    fTime.value = normTime(evFullOrNull.event_time || "") || "";
    fDesc.value = evFullOrNull.description || "";

    const teacherIds = (Array.isArray(evFullOrNull.teachers) ? evFullOrNull.teachers : [])
      .map((t) => t.id)
      .filter((x) => x !== undefined && x !== null)
      .map(String);

    const classNames = (Array.isArray(evFullOrNull.classes) ? evFullOrNull.classes : []);

    setSelectedValues(fTeachers, teacherIds);
    setSelectedValues(fClasses, classNames);
  }

  async function saveForm() {
    const payload = {
      title: fTitle.value.trim(),
      place: fPlace.value.trim() || null,
      event_date: fDate.value || null,
      event_time: fTime.value ? `${fTime.value}:00` : null,
      description: fDesc.value.trim() || null,

      teacherIds: getSelectedValues(fTeachers).map((x) => Number(x)).filter((n) => Number.isFinite(n)),
      studentIds: [], 
      classNames: getSelectedValues(fClasses),
    };

    if (!payload.title) return alert("Prosím zadaj názov udalosti.");
    if (!payload.event_date) return alert("Prosím zadaj dátum.");

    try {
      if (mode === "new") {  
        await api.createEvent(payload);
      } else if (mode === "edit" && selectedId) {
        await api.updateEvent(selectedId, payload);
      }

      closeModal();
      await refreshAll();
    } catch (e) {
      console.error(e);
      alert("Nepodarilo sa uložiť udalosť.");
    }
  }

  async function deleteSelected() {
    if (!selectedId) return;
    if (!confirm("Naozaj chceš vymazať túto udalosť?")) return;

    try {
      await api.deleteEvent(selectedId);
      closeModal();
      await refreshAll();
    } catch (e) {
      console.error(e);
      alert("Nepodarilo sa vymazať udalosť.");
    }
  }


  async function refreshAll() {
 
    try {
      const [teachers, students, events] = await Promise.all([
        api.teachers(),
        api.students(),
        api.events(),
      ]);

      TEACHERS = Array.isArray(teachers) ? teachers : [];

      const st = Array.isArray(students) ? students : [];
  
      const classes = st
        .map((s) => s.class || s.class_name || s.className || s.trieda || s.trieda_name)
        .map((x) => (x ? String(x).trim() : ""))
        .filter(Boolean);

      CLASSES = Array.from(new Set(classes)).sort((a, b) => a.localeCompare(b, "sk"));

      EVENTS = Array.isArray(events) ? events : [];

      renderLists();

    
      prepareForm(mode === "new" ? null : null);
    } catch (e) {
      console.error(e);
      alert("Nepodarilo sa načítať dáta (events/teachers/students). Skontroluj server a API.");
    }
  }


  document.addEventListener("click", (e) => {
    const card = e.target.closest(".event-card");
    if (!card) return;
    const id = card.dataset.eventId;
    if (id) openEvent(id);
  });

  btnNew.addEventListener("click", () => {
    selectedId = null;
    mode = "new";
    setVisible("form");
    prepareForm(null);
    openModal();
  });

  btnRefresh.addEventListener("click", refreshAll);

  btnClose.addEventListener("click", closeModal);
  btnClose2.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  btnEdit.addEventListener("click", async () => {
    if (!selectedId) return;
    mode = "edit";
    setVisible("form");

    try {
      const full = await api.eventById(selectedId);
      prepareForm(full);
    } catch (e) {
      console.error(e);
      alert("Nepodarilo sa načítať udalosť pre úpravu.");
      closeModal();
    }
  });

  btnDelete.addEventListener("click", deleteSelected);
  btnCancel.addEventListener("click", () => {

    mode = selectedId ? "view" : "view";
    setVisible("view");
  });
  btnSave.addEventListener("click", saveForm);


  document.addEventListener("DOMContentLoaded", refreshAll);
})();
// studenti
async function studentsApiGet() {
  const r = await fetch("/api/students");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function studentsApiAdd(payload) {
  const r = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function studentsApiDelete(id) {
  const r = await fetch(`/api/students/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json().catch(() => ({}));
}

let DASH_STUDENTS = [];

function normStudent(s) {
  return {
    id: s.id,
    name: s.name || s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || "—",
    className: (s.class || s.class_name || s.className || s.trieda || "").trim(),
  };
}

function renderStudentsTable() {
  const searchEl = document.getElementById("studentSearch");
  const tbody = document.getElementById("studentsTable");
  const cnt = document.getElementById("studentsCount");
  if (!tbody || !cnt) return;

  const q = (searchEl?.value || "").trim().toLowerCase();

  const filtered = DASH_STUDENTS.filter((s) => {
    const hay = `${s.name} ${s.className}`.toLowerCase();
    return !q || hay.includes(q);
  });

  cnt.textContent = `Spolu: ${DASH_STUDENTS.length} • Zobrazené: ${filtered.length}`;

  tbody.innerHTML = filtered
    .sort((a, b) => a.name.localeCompare(b.name, "sk"))
    .map((s) => `
      <tr>
        <td style="padding:10px;border-top:1px solid #eee;">${s.name}</td>
        <td style="padding:10px;border-top:1px solid #eee;opacity:.85;">${s.className || "—"}</td>
        <td style="padding:10px;border-top:1px solid #eee;text-align:right;">
          <button data-del-student="${s.id}"
            style="padding:8px 12px;border-radius:999px;border:1px solid #b91c1c;background:#b91c1c;color:#fff;cursor:pointer;">
            Vymazať
          </button>
        </td>
      </tr>
    `)
    .join("");
}

async function loadStudentsToDashboard() {
  const list = await studentsApiGet();
  DASH_STUDENTS = (Array.isArray(list) ? list : []).map(normStudent);
  renderStudentsTable();
}

function hookStudentsDashboardUI() {
  const btn = document.getElementById("btnAddStudent");
  const nameEl = document.getElementById("studentName");
  const classEl = document.getElementById("studentClass");
  const searchEl = document.getElementById("studentSearch");

  searchEl?.addEventListener("input", renderStudentsTable);

  btn?.addEventListener("click", async () => {
    const name = (nameEl?.value || "").trim();
    const cls = (classEl?.value || "").trim();
    if (!name) return alert("Zadaj meno študenta.");
    if (!cls) return alert("Zadaj triedu.");

    try {
      await studentsApiAdd({ name, class: cls });
      nameEl.value = "";
      classEl.value = "";
      await loadStudentsToDashboard();
    } catch (e) {
      console.error(e);
      alert("Nepodarilo sa pridať študenta.");
    }
  });

  document.addEventListener("click", async (e) => {
    const btnDel = e.target.closest("[data-del-student]");
    if (!btnDel) return;

    const id = btnDel.getAttribute("data-del-student");
    if (!id) return;
    if (!confirm("Naozaj chceš vymazať študenta?")) return;

    try {
      await studentsApiDelete(id);
      await loadStudentsToDashboard();
    } catch (err) {
      console.error(err);
      alert("Nepodarilo sa vymazať študenta.");
    }
  });
}


document.addEventListener("DOMContentLoaded", () => {
  hookStudentsDashboardUI();
  loadStudentsToDashboard().catch(console.error);
});
