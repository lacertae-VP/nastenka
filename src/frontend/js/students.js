(() => {
  const $ = (s) => document.querySelector(s);

  const classGrid = $("#classGrid");
  const empty = $("#empty");
  const classCount = $("#classCount");
  const studentCount = $("#studentCount");

  const backdrop = $("#backdrop");
  const closeBtn = $("#close");

  const mClass = $("#mClass");
  const shownCount = $("#shownCount");
  const q = $("#q");
  const sort = $("#sort");
  const studentList = $("#studentList");

  let STUDENTS = [];
  let CLASS_MAP = new Map(); 
  let CURRENT_CLASS = null;

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeStudent(s) {
    const name =
      s.name ||
      s.full_name ||
      `${s.first_name || ""} ${s.last_name || ""}`.trim() ||
      "—";

    const cls =
      s.class ||
      s.class_name ||
      s.className ||
      s.trieda ||
      s.trieda_name ||
      "";

    return { name, className: String(cls || "").trim() };
  }

  async function fetchStudents() {
    if (window.API?.fetchJSON) return window.API.fetchJSON("/students");
    if (window.api?.getStudents) return window.api.getStudents();

    const r = await fetch("/api/students");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  function buildClassMap(list) {
    CLASS_MAP = new Map();
    for (const s of list) {
      if (!s.className) continue;
      if (!CLASS_MAP.has(s.className)) CLASS_MAP.set(s.className, []);
      CLASS_MAP.get(s.className).push(s);
    }

 
    for (const [k, arr] of CLASS_MAP.entries()) {
      arr.sort((a, b) => a.name.localeCompare(b.name, "sk"));
    }
  }

  function classCardHTML(className, n) {
    return `
      <div class="class-card" data-class="${esc(className)}">
        <div class="class-title">${esc(className)}</div>
        <div class="class-meta">
          <span class="tag">Študenti: ${n}</span>
          <span class="tag">Klik pre zoznam</span>
        </div>
      </div>
    `;
  }

  function renderClasses() {
    studentCount.textContent = String(STUDENTS.length);

    const classes = [...CLASS_MAP.keys()].sort((a, b) => a.localeCompare(b, "sk"));
    classCount.textContent = String(classes.length);

    if (!classes.length) {
      classGrid.innerHTML = "";
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";
    classGrid.innerHTML = classes
      .map((c) => classCardHTML(c, CLASS_MAP.get(c).length))
      .join("");
  }

  function openModal(className) {
    CURRENT_CLASS = className;
    mClass.textContent = className;
    q.value = "";
    sort.value = "name_asc";

    renderStudents();
    backdrop.classList.add("show");
  }

  function closeModal() {
    backdrop.classList.remove("show");
    CURRENT_CLASS = null;
  }

  function applyFilter(list, query) {
    const s = query.trim().toLowerCase();
    if (!s) return list;
    return list.filter((x) => x.name.toLowerCase().includes(s));
  }

  function applySort(list, mode) {
    const arr = [...list];
    if (mode === "name_asc") arr.sort((a, b) => a.name.localeCompare(b.name, "sk"));
    if (mode === "name_desc") arr.sort((a, b) => b.name.localeCompare(a.name, "sk"));
    return arr;
  }

  function renderStudents() {
    const all = CLASS_MAP.get(CURRENT_CLASS) || [];
    const filtered = applyFilter(all, q.value);
    const sorted = applySort(filtered, sort.value);

    shownCount.textContent = String(sorted.length);

    if (!sorted.length) {
      studentList.innerHTML = `<div class="empty">Nenašli sa žiadni študenti.</div>`;
      return;
    }

    studentList.innerHTML = sorted
      .map((s) => {
      
        return `<div class="student-item">${esc(s.name)}</div>`;
      })
      .join("");
  }

  // Events
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".class-card");
    if (!card) return;
    const cls = card.getAttribute("data-class");
    if (cls) openModal(cls);
  });

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  q.addEventListener("input", renderStudents);
  sort.addEventListener("change", renderStudents);


  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const list = await fetchStudents();
      STUDENTS = (Array.isArray(list) ? list : [])
        .map(normalizeStudent)
        .filter((s) => s.className); 

      buildClassMap(STUDENTS);
      renderClasses();
    } catch (err) {
      console.error(err);
      classGrid.innerHTML = `<div class="empty">Nepodarilo sa načítať študentov. Skontroluj server a /api/students.</div>`;
      empty.style.display = "none";
    }
  });
})();
