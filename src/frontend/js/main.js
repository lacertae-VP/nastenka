(async function () {
  const api = window.__NB_API__;
  if (!api) return;


  const elNearest = document.getElementById("home-nearest");
  const elStatsTotal = document.getElementById("home-stat-total");
  const elStatsUpcoming = document.getElementById("home-stat-upcoming");
  const elStatsPast = document.getElementById("home-stat-past");
  const elUpcomingList = document.getElementById("home-upcoming-list");

  if (!elNearest || !elStatsTotal || !elStatsUpcoming || !elStatsPast || !elUpcomingList) return;

  function escapeHTML(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
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

  function fmtDate(ev) {
    const dt = parseEventDate(ev);
    if (!dt) return "-";
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  function fmtTime(ev) {
    const t = normalizeTime(ev.event_time || ev.time || "");
    return t ? t : "—";
  }

  function cardHTML(ev) {
    const place = ev.place || ev.event_place || "—";
    const desc = ev.description || "";
    return `
      <div class="event-card" data-event-id="${escapeHTML(ev.id)}">
        <div class="event-card-title">${escapeHTML(ev.title || "")}</div>
        <div class="event-card-meta">
          Dátum: ${fmtDate(ev)} • Čas: ${fmtTime(ev)} • Miesto: ${escapeHTML(place)}
        </div>
        ${desc ? `<div class="event-card-desc">${escapeHTML(desc)}</div>` : ""}
      </div>
    `;
  }

  try {
    const events = await api.fetchJSON("/events");
    const now = new Date();

    const withDt = (Array.isArray(events) ? events : [])
      .map((e) => ({ e, dt: parseEventDate(e) }))
      .filter((x) => x.dt);

    withDt.sort((a, b) => a.dt - b.dt);

    const upcoming = withDt.filter((x) => x.dt >= now).map((x) => x.e);
    const past = withDt.filter((x) => x.dt < now).map((x) => x.e);

    elStatsTotal.textContent = String(events.length);
    elStatsUpcoming.textContent = String(upcoming.length);
    elStatsPast.textContent = String(past.length);

    elNearest.innerHTML = upcoming.length
      ? cardHTML(upcoming[0])
      : `<div class="muted">Žiadne nadchádzajúce udalosti.</div>`;

    const next3 = upcoming.slice(0, 3);
    elUpcomingList.innerHTML = next3.length
      ? next3.map(cardHTML).join("")
      : `<div class="muted">Žiadne nadchádzajúce udalosti.</div>`;


    function goToEventFromClick(ev) {
      const card = ev.target.closest("[data-event-id]");
      if (!card) return;
      const id = card.getAttribute("data-event-id");
      window.location.href = `/pages/events.html?open=${encodeURIComponent(id)}`;
    }

    elNearest.addEventListener("click", goToEventFromClick);
    elUpcomingList.addEventListener("click", goToEventFromClick);
  } catch (err) {
    elNearest.innerHTML = `<div class="muted">Nepodarilo sa načítať udalosti.</div>`;
    elUpcomingList.innerHTML = "";
    console.error(err);
  }
})();
