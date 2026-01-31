(() => {
  const listEl = document.getElementById("homeList");
  const errEl = document.getElementById("homeError");

  const statTotal = document.getElementById("statTotal");
  const statUpcoming = document.getElementById("statUpcoming");
  const statPast = document.getElementById("statPast");

  const btnAll = document.getElementById("homeBtnAll");
  const btnAdd = document.getElementById("homeBtnAdd");
  const btnRefresh = document.getElementById("homeBtnRefresh");

  if (!listEl || !statTotal || !statUpcoming || !statPast) return;

  function escapeHTML(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function normalizeTime(t) {
    if (!t) return "";
    return String(t).slice(0, 5);
  }

  function parseEventDate(ev) {
    const raw = ev.event_date || ev.date || "";
    const datePart = String(raw).slice(0, 10);
    if (!datePart) return null;

    const t = normalizeTime(ev.event_time || ev.time || "");
    const safeTime = t ? `${t}:00` : "23:59:59";
    const dt = new Date(`${datePart}T${safeTime}`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function fmtDate(dt) {
    return `${pad2(dt.getDate())}.${pad2(dt.getMonth() + 1)}.${dt.getFullYear()}`;
  }

  function fmtTime(ev, dt) {
    const t = normalizeTime(ev.event_time || ev.time || "");
    return t ? `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}` : "—";
  }

  function showError(msg) {
    if (!errEl) return;
    errEl.style.display = "block";
    errEl.textContent = msg;
  }

  function hideError() {
    if (!errEl) return;
    errEl.style.display = "none";
    errEl.textContent = "";
  }

  async function getEvents() {
    const r = await fetch("/api/events");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  function renderEmpty(text) {
    listEl.innerHTML = `<div class="h-empty">${escapeHTML(text)}</div>`;
  }

  function evHTML(ev) {
    const dt = parseEventDate(ev);
    const dateText = dt ? fmtDate(dt) : "—";
    const timeText = dt ? fmtTime(ev, dt) : "—";
    const place = ev.place || "—";
    const desc = ev.description || "";

    const badge = dt ? `${dateText} • ${timeText}` : "—";

    return `
      <div class="h-ev" data-event-id="${escapeHTML(ev.id)}">
        <div class="h-ev-top">
          <div class="h-ev-title">${escapeHTML(ev.title || "—")}</div>
          <div class="h-badge">${escapeHTML(badge)}</div>
        </div>
        <div class="h-ev-meta">Miesto: ${escapeHTML(place)}</div>
        ${desc ? `<p class="h-ev-desc">${escapeHTML(desc)}</p>` : ""}
      </div>
    `;
  }

  async function refresh() {
    hideError();
    renderEmpty("Načítavam udalosti…");

    try {
      const events = await getEvents();
      const now = new Date();

      const parsed = (Array.isArray(events) ? events : [])
        .map((ev) => ({ ev, dt: parseEventDate(ev) }))
        .filter((x) => x.dt);

      parsed.sort((a, b) => a.dt - b.dt);

      const upcoming = parsed.filter((x) => x.dt >= now).map((x) => x.ev);
      const past = parsed.filter((x) => x.dt < now).map((x) => x.ev);

      statTotal.textContent = String(Array.isArray(events) ? events.length : 0);
      statUpcoming.textContent = String(upcoming.length);
      statPast.textContent = String(past.length);

      const next3 = upcoming.slice(0, 3);

      if (!next3.length) {
        renderEmpty("Zatiaľ tu nie sú žiadne nadchádzajúce udalosti.");
        return;
      }

      listEl.innerHTML = next3.map(evHTML).join("");
    } catch (err) {
      console.error(err);
      showError("Nepodarilo sa načítať udalosti. Skontroluj server a /api/events.");
      renderEmpty("Zatiaľ tu nie sú žiadne udalosti.");
    }
  }


  listEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-event-id]");
    if (!card) return;
    const id = card.getAttribute("data-event-id");
    window.location.href = `/pages/events.html?open=${encodeURIComponent(id)}`;
  });

  if (btnAll) btnAll.addEventListener("click", () => (window.location.href = "/pages/events.html"));
  if (btnAdd) btnAdd.addEventListener("click", () => (window.location.href = "/pages/dashboard.html"));
  if (btnRefresh) btnRefresh.addEventListener("click", refresh);

  document.addEventListener("DOMContentLoaded", refresh);
})();
