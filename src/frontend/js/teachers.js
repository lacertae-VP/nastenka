// src/frontend/js/teachers.js
(() => {
  const $ = (s) => document.querySelector(s);

  const grid = $("#grid");
  const empty = $("#empty");
  const q = $("#q");
  const sort = $("#sort");
  const count = $("#count");
  const shown = $("#shown");

  let TEACHERS = [];

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeTeacher(t) {
    const name =
      t.name ||
      t.full_name ||
      `${t.first_name || ""} ${t.last_name || ""}`.trim() ||
      "—";

    return {
      id: t.id ?? "",
      name,
      subject: t.subject || t.department || t.specialization || "",
      note: t.note || t.description || "",
    };
  }

  async function fetchTeachers() {
    if (window.API?.fetchJSON) return window.API.fetchJSON("/teachers");
    if (window.api?.getTeachers) return window.api.getTeachers();

    const r = await fetch("/api/teachers");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  function cardHTML(t) {
    const tags = [];
    if (t.subject) tags.push(`<span class="tag">${esc(t.subject)}</span>`);
    return `
      <div class="t-card">
        <div class="t-name">${esc(t.name)}</div>
        <div class="t-meta">
          ${tags.join("") || `<span class="tag">Učiteľ</span>`}
        </div>
        ${t.note ? `<div class="t-line">${esc(t.note)}</div>` : ""}
      </div>
    `;
  }

  function applySort(list, mode) {
    const arr = [...list];
    if (mode === "name_asc") arr.sort((a, b) => a.name.localeCompare(b.name, "sk"));
    if (mode === "name_desc") arr.sort((a, b) => b.name.localeCompare(a.name, "sk"));
    if (mode === "id_desc") arr.sort((a, b) => Number(b.id) - Number(a.id));
    if (mode === "id_asc") arr.sort((a, b) => Number(a.id) - Number(b.id));
    return arr;
  }

  function applyFilter(list, query) {
    const s = query.trim().toLowerCase();
    if (!s) return list;
    return list.filter((t) => {
      const hay = `${t.name} ${t.subject} ${t.note}`.toLowerCase();
      return hay.includes(s);
    });
  }

  function render() {
    const all = TEACHERS;
    count.textContent = String(all.length);

    const filtered = applyFilter(all, q.value);
    const sorted = applySort(filtered, sort.value);

    shown.textContent = String(sorted.length);

    if (!sorted.length) {
      grid.innerHTML = "";
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";
    grid.innerHTML = sorted.map(cardHTML).join("");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const list = await fetchTeachers();
      TEACHERS = (Array.isArray(list) ? list : []).map(normalizeTeacher);
      render();
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div class="t-empty">Nepodarilo sa načítať učiteľov. Skontroluj server a /api/teachers.</div>`;
      empty.style.display = "none";
    }
  });

  q.addEventListener("input", render);
  sort.addEventListener("change", render);
})();
