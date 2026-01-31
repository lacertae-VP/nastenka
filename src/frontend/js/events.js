(() => {
  console.log("✅ events.js loaded (stable)");


  const $ = (sel) => document.querySelector(sel);

  const upcomingWrap = $("#upcomingEvents") || $("#upcoming");
  const pastWrap = $("#pastEvents") || $("#past");
  const errorBox = $("#eventsError") || $("#error");

  // modal 
  const backdrop = $("#modalBackdrop") || $("#eventModalBackdrop");
  const modalTitle = $("#modalTitle");
  const modalClose = $("#modalClose") || $("#eventModalClose");
  const modalView = $("#modalView") || $("#eventModal") || $("#detailModal");

  const mDate = $("#mDate");
  const mTime = $("#mTime");
  const mPlace = $("#mPlace");
  const mDesc = $("#mDesc");
  const mTeachers = $("#mTeachers") || $("#modalTeachers") || $("#detailTeachers");
  const mStudents = $("#mStudents") || $("#modalStudents") || $("#detailStudents");
  const mClasses = $("#mClasses") || $("#modalClasses") || $("#detailClasses");



  // edit form
  const modalEdit = $("#modalEdit");
  const editForm = $("#editForm");
  const eTitle = $("#eTitle") || $("#editTitle");
  const eDate = $("#eDate") || $("#editDate");
  const eTime = $("#eTime") || $("#editTime");
  const ePlace = $("#ePlace") || $("#editPlace");
  const eDesc = $("#eDesc") || $("#editDesc");
  const btnCancelEdit = $("#btnCancelEdit") || $("#editCancel");

  let EVENTS = [];
  let selectedEvent = null;

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeTime(t) {
    if (!t) return "";
    return String(t).slice(0, 5);
  }

  function makeDateTime(ev) {
    const rawDate = ev.event_date || ev.date || "";
    const datePart = String(rawDate).slice(0, 10);

    const timePart = normalizeTime(ev.event_time || ev.time || "");
    const safeTime = timePart ? `${timePart}:00` : "23:59:00";

   
    return new Date(`${datePart}T${safeTime}`);
  }

  function toLocalDateStr(d) {
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  }

  function toLocalTimeStr(d) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function showError(msg) {
    if (!errorBox) return;
    errorBox.style.display = "block";
    errorBox.textContent = msg;
  }

  function hideError() {
    if (!errorBox) return;
    errorBox.style.display = "none";
    errorBox.textContent = "";
  }

  function showModal() {
    if (backdrop) backdrop.style.display = "block";
    if (modalView) modalView.style.display = "block";
    if (modalEdit) modalEdit.style.display = "none"; 
  }

  function closeModal() {
    if (backdrop) backdrop.style.display = "none";
    if (modalView) modalView.style.display = "none";
    if (modalEdit) modalEdit.style.display = "none";
    selectedEvent = null;
  }


  async function apiGet(path) {
    const res = await fetch(`/api${path}`);
    const text = await res.text().catch(() => "");
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      throw new Error((data && data.message) || `HTTP ${res.status}`);
    }
    return data;
  }

  async function apiUpdateEvent(id, payload) {
    const res = await fetch(`/api/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => "");
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) throw new Error((data && data.message) || `HTTP ${res.status}`);
    return data;
  }

  async function apiDeleteEvent(id) {
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json().catch(() => ({}));
  }

  async function apiEventDetails(id) {
   
    try {
      return await apiGet(`/events/${id}`);
    } catch {
      return { teachers: [], students: [], classes: [] };
    }
  }

 
  function makeCardHTML(ev) {
    const dt = makeDateTime(ev);
    const dateText = toLocalDateStr(dt);
    const timeText = normalizeTime(ev.event_time) ? toLocalTimeStr(dt) : "";
    const place = ev.place ? ` • Miesto: ${escapeHtml(ev.place)}` : "";
    const timePart = timeText ? ` • ${timeText}` : "";

    return `
      <div class="event-card" data-event-id="${escapeHtml(ev.id)}" style="cursor:pointer">
        <div class="event-title">${escapeHtml(ev.title || "—")}</div>
        <div class="event-meta">Dátum: ${dateText}${timePart}${place}</div>
        ${ev.description ? `<div class="event-desc">${escapeHtml(ev.description)}</div>` : ""}
      </div>
    `;
  }

  function renderEmpty(el, text) {
    if (!el) return;
    el.innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
  }

  async function refresh() {
    hideError();

    if (upcomingWrap) upcomingWrap.innerHTML = "";
    if (pastWrap) pastWrap.innerHTML = "";

    try {
      const list = await apiGet("/events");
      EVENTS = Array.isArray(list) ? list : [];

      const now = new Date();
      const upcoming = [];
      const past = [];

      for (const ev of EVENTS) {
        const dt = makeDateTime(ev);
        if (dt.getTime() >= now.getTime()) upcoming.push(ev);
        else past.push(ev);
      }

      upcoming.sort((a, b) => makeDateTime(a) - makeDateTime(b));
      past.sort((a, b) => makeDateTime(b) - makeDateTime(a));

      if (!upcoming.length) renderEmpty(upcomingWrap, "Žiadne nadchádzajúce udalosti.");
      else if (upcomingWrap) upcomingWrap.innerHTML = upcoming.map(makeCardHTML).join("");

      if (!past.length) renderEmpty(pastWrap, "Žiadne minulé udalosti.");
      else if (pastWrap) pastWrap.innerHTML = past.map(makeCardHTML).join("");
    } catch (e) {
      console.error(e);
      showError("Nepodarilo sa načítať udalosti. Skontroluj server a /api/events.");
    }
  }

  // otvorit
  async function openEvent(id) {
    const ev = EVENTS.find((x) => String(x.id) === String(id));
    if (!ev) return;

    selectedEvent = ev;

    if (modalTitle) modalTitle.textContent = ev.title || "—";

    const dt = makeDateTime(ev);
    if (mDate) mDate.textContent = toLocalDateStr(dt);
    if (mTime) mTime.textContent = normalizeTime(ev.event_time) ? toLocalTimeStr(dt) : "—";
    if (mPlace) mPlace.textContent = ev.place || "—";
    if (mDesc) mDesc.textContent = ev.description || "—";

    const details = await apiEventDetails(ev.id);
    const teachers = Array.isArray(details.teachers) ? details.teachers : [];
    const students = Array.isArray(details.students) ? details.students : [];
    const classes = Array.isArray(details.classes) ? details.classes : [];

    const teacherHTML = teachers.length
      ? teachers.map((t) => `<li>${escapeHtml(t.name || t.full_name || `${t.first_name || ""} ${t.last_name || ""}`.trim() || "—")}</li>`).join("")
      : `<li>—</li>`;

    const studentHTML = students.length
      ? students.map((s) => `<li>${escapeHtml(s.name || s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || "—")}</li>`).join("")
      : `<li>—</li>`;

    const classHTML = classes.length
      ? classes.map((c) => `<li>${escapeHtml(c || "—")}</li>`).join("")
      : `<li>—</li>`;

  
    if (mTeachers) mTeachers.innerHTML = teacherHTML;
    if (mStudents) mStudents.innerHTML = studentHTML;
    if (mClasses) mClasses.innerHTML = classHTML;

    showModal();
  }

 
  window.openEvent = openEvent;

 
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".event-card");
    if (!card) return;
    const id = card.getAttribute("data-event-id");
    if (!id) return;
    openEvent(id);
  });

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);


  if (btnCancelEdit) {
    btnCancelEdit.addEventListener("click", (e) => {
      e.preventDefault();
      if (modalEdit) modalEdit.style.display = "none";
    });
  }

  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!selectedEvent) return;

      const payload = {
        title: eTitle ? eTitle.value.trim() : selectedEvent.title,
        event_date: eDate ? eDate.value : String(selectedEvent.event_date || "").slice(0, 10),
        event_time: eTime ? (eTime.value ? `${eTime.value}:00` : null) : selectedEvent.event_time,
        place: ePlace ? ePlace.value.trim() : selectedEvent.place,
        description: eDesc ? eDesc.value.trim() : selectedEvent.description,
      };

      try {
        await apiUpdateEvent(selectedEvent.id, payload);
        if (modalEdit) modalEdit.style.display = "none";
        closeModal();
        await refresh();
      } catch (err) {
        console.error(err);
        alert("Nepodarilo sa upraviť udalosť.");
      }
    });
  }


  document.addEventListener("DOMContentLoaded", refresh);
})();
