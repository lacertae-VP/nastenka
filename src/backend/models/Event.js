const pool = require('../config/database');

class Event {
  static async _hasColumn(table, column) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    return Number(rows?.[0]?.cnt || 0) > 0;
  }

  static async _selectColumns() {
    const cols = ['id', 'title', 'event_date'];
    if (await this._hasColumn('events', 'event_time')) cols.push('event_time');
    if (await this._hasColumn('events', 'place')) cols.push('place');
    if (await this._hasColumn('events', 'description')) cols.push('description');
    if (await this._hasColumn('events', 'created_at')) cols.push('created_at');
    if (await this._hasColumn('events', 'updated_at')) cols.push('updated_at');
    return cols;
  }

  static async getAll() {
    const cols = await this._selectColumns();
    const [rows] = await pool.execute(`SELECT ${cols.join(', ')} FROM events ORDER BY event_date ASC, id ASC`);
    return rows;
  }

  static async getById(id) {
    const cols = await this._selectColumns();
    const [rows] = await pool.execute(`SELECT ${cols.join(', ')} FROM events WHERE id = ? LIMIT 1`, [id]);
    const event = rows?.[0];
    if (!event) return null;

    // Učitelia na udalosti
    const [teachers] = await pool.execute(
      `SELECT t.id, t.name, t.subject
       FROM teachers t
       INNER JOIN event_teachers et ON et.teacher_id = t.id
       WHERE et.event_id = ?
       ORDER BY t.name ASC`,
      [id]
    );

    // Žiaci na u 
    const [students] = await pool.execute(
      `SELECT s.id, s.name, s.class
       FROM students s
       INNER JOIN event_students es ON es.student_id = s.id
       WHERE es.event_id = ?
       ORDER BY s.class ASC, s.name ASC`,
      [id]
    );

    // Triedy na u
    const [classes] = await pool.execute(
      `SELECT class_name
       FROM event_classes
       WHERE event_id = ?
       ORDER BY class_name ASC`,
      [id]
    );

    return {
      ...event,
      teachers,
      students,
      classes: classes.map((c) => c.class_name),
    };
  }

  static async create(payload) {
    const {
      title,
      event_date,
      event_time = null,
      place = null,
      description = null,
      teacherIds = [],
      classNames = [],
      studentIds = [],
    } = payload;

    // Vloženie udalosti 
    const cols = [];
    const vals = [];
    const params = [];

    cols.push('title');
    vals.push('?');
    params.push(title);

    cols.push('event_date');
    vals.push('?');
    params.push(event_date);

    if (await this._hasColumn('events', 'event_time')) {
      cols.push('event_time');
      vals.push('?');
      params.push(event_time);
    }

    if (await this._hasColumn('events', 'place')) {
      cols.push('place');
      vals.push('?');
      params.push(place);
    }

    if (await this._hasColumn('events', 'description')) {
      cols.push('description');
      vals.push('?');
      params.push(description);
    }

    const [result] = await pool.execute(
      `INSERT INTO events (${cols.join(', ')}) VALUES (${vals.join(', ')})`,
      params
    );
    const eventId = result.insertId;

    // Prepojenie učiteľov
    if (Array.isArray(teacherIds) && teacherIds.length) {
      const rows = teacherIds.map((tid) => [eventId, Number(tid)]);
      await pool.query('INSERT INTO event_teachers (event_id, teacher_id) VALUES ?', [rows]);
    }

    // Prepojenie tried
    if (Array.isArray(classNames) && classNames.length) {
      const uniq = [...new Set(classNames.map((c) => String(c).trim()).filter(Boolean))];
      if (uniq.length) {
        const rows = uniq.map((cn) => [eventId, cn]);
        await pool.query('INSERT INTO event_classes (event_id, class_name) VALUES ?', [rows]);
      }
    }

    // Prepojenie žiakov 
    if (Array.isArray(studentIds) && studentIds.length) {
      const rows = studentIds.map((sid) => [eventId, Number(sid)]);
      await pool.query('INSERT INTO event_students (event_id, student_id) VALUES ?', [rows]);
    }

    return this.getById(eventId);
  }

  static async update(id, payload) {
    const {
      title,
      event_date,
      event_time = null,
      place = null,
      description = null,
      teacherIds = null,
      classNames = null,
      studentIds = null,
    } = payload;

    // Update 
    const sets = [];
    const params = [];

    if (typeof title === 'string') {
      sets.push('title = ?');
      params.push(title);
    }

    if (typeof event_date === 'string' || event_date instanceof Date) {
      sets.push('event_date = ?');
      params.push(event_date);
    }

    if (await this._hasColumn('events', 'event_time')) {
      if (payload.hasOwnProperty('event_time')) {
        sets.push('event_time = ?');
        params.push(event_time);
      }
    }

    if (await this._hasColumn('events', 'place')) {
      if (payload.hasOwnProperty('place')) {
        sets.push('place = ?');
        params.push(place);
      }
    }

    if (await this._hasColumn('events', 'description')) {
      if (payload.hasOwnProperty('description')) {
        sets.push('description = ?');
        params.push(description);
      }
    }

    if (sets.length) {
      params.push(id);
      await pool.execute(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    // Vzťahy 
    if (Array.isArray(teacherIds)) {
      await pool.execute('DELETE FROM event_teachers WHERE event_id = ?', [id]);
      if (teacherIds.length) {
        const rows = teacherIds.map((tid) => [Number(id), Number(tid)]);
        await pool.query('INSERT INTO event_teachers (event_id, teacher_id) VALUES ?', [rows]);
      }
    }

    if (Array.isArray(classNames)) {
      await pool.execute('DELETE FROM event_classes WHERE event_id = ?', [id]);
      const uniq = [...new Set(classNames.map((c) => String(c).trim()).filter(Boolean))];
      if (uniq.length) {
        const rows = uniq.map((cn) => [Number(id), cn]);
        await pool.query('INSERT INTO event_classes (event_id, class_name) VALUES ?', [rows]);
      }
    }

    if (Array.isArray(studentIds)) {
      await pool.execute('DELETE FROM event_students WHERE event_id = ?', [id]);
      if (studentIds.length) {
        const rows = studentIds.map((sid) => [Number(id), Number(sid)]);
        await pool.query('INSERT INTO event_students (event_id, student_id) VALUES ?', [rows]);
      }
    }

    return this.getById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Event;
//  click
document.addEventListener("click", async (e) => {
  const card = e.target.closest("[data-event-id]");
  if (!card) return;

  const id = card.getAttribute("data-event-id");
  if (!id) return;

  try {
    await showEventDetails(id); 
  } catch (err) {
    console.error(err);
    alert("Chyba: Nepodarilo sa načítať detail udalosti.");
  }
});
document.addEventListener("click", async (e) => {
  const card = e.target.closest("[data-event-id]");
  if (!card) return;

  const id = card.getAttribute("data-event-id");
  if (!id) return;

  console.log("CLICK EVENT ID:", id);

  
  if (typeof window.openEvent === "function") return window.openEvent(id);
  if (typeof window.showEventDetails === "function") return window.showEventDetails(id);
  if (typeof window.openEventModal === "function") return window.openEventModal(id);

 
  const modal = document.getElementById("eventModal");
  if (!modal) return alert("Chyba: eventModal neexistuje v HTML.");

  modal.style.display = "block";
  modal.innerHTML = `<div style="padding:20px">Načítavam detail udalosti ID: ${id}...</div>`;
});
