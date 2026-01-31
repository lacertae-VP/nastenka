(function () {
  if (window.API && window.API.fetchJSON) return;

  const API = (window.API = window.API || {});
  API.baseUrl = "/api";

  API.fetchJSON = async function (path, options) {
    const res = await fetch(API.baseUrl + path, {
      headers: { "Content-Type": "application/json" },
      ...(options || {}),
    });

    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

    if (!res.ok) {
      const msg = (data && data.message) || (typeof data === "string" ? data : "") || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  };

  API.getEvents = () => API.fetchJSON("/events");
  API.getEvent = (id) => API.fetchJSON(`/events/${id}`);
  API.getTeachers = () => API.fetchJSON("/teachers");
  API.getStudents = () => API.fetchJSON("/students");

  API.toEventDateTime = function (ev) {
    const date = ev.event_date || ev.date;
    const time = ev.event_time || ev.time || "";
    const iso = time ? `${date}T${String(time).slice(0, 8)}` : `${date}T23:59:59`;
    return new Date(iso);
  };
})();
