const db = require("../config/database");

// všetky udalosti
exports.getAllEvents = async (req, res) => {
  try {
    const [events] = await db.query("SELECT * FROM events ORDER BY event_date DESC");
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba servera" });
  }
};

// id
exports.getEventById = async (req, res) => {
  const eventId = req.params.id;

  try {
    const [[event]] = await db.query(
      "SELECT * FROM events WHERE id = ?",
      [eventId]
    );

    if (!event) {
      return res.status(404).json({ message: "Udalosť sa nenašla" });
    }

    const [teachers] = await db.query(`
      SELECT t.*
      FROM teachers t
      JOIN event_teachers et ON et.teacher_id = t.id
      WHERE et.event_id = ?
    `, [eventId]);

    const [students] = await db.query(`
      SELECT s.*
      FROM students s
      JOIN event_students es ON es.student_id = s.id
      WHERE es.event_id = ?
    `, [eventId]);

    const [classes] = await db.query(`
      SELECT class_name
      FROM event_classes
      WHERE event_id = ?
    `, [eventId]);

    res.json({
      ...event,
      teachers,
      students,
      classes: classes.map(c => c.class_name)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba servera" });
  }
};

// vytvoriť novú udalosť
exports.createEvent = async (req, res) => {
  const {
    title,
    event_date,
    event_time,
    place,
    description,
    teacherIds = [],
    classNames = []
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO events (title, event_date, event_time, place, description)
       VALUES (?, ?, ?, ?, ?)`,
      [title, event_date, event_time || null, place || null, description || null]
    );

    const eventId = result.insertId;

    // ucitelia
    for (const teacherId of teacherIds) {
      await db.query(
        "INSERT INTO event_teachers (event_id, teacher_id) VALUES (?, ?)",
        [eventId, teacherId]
      );
    }

    // triedy
    for (const className of classNames) {
      await db.query(
        "INSERT INTO event_classes (event_id, class_name) VALUES (?, ?)",
        [eventId, className]
      );
    }

    res.status(201).json({ id: eventId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba pri vytváraní udalosti" });
  }
};

// obnoviť udalosť

exports.updateEvent = async (req, res) => {
  const eventId = req.params.id;
  const {
    title,
    event_date,
    event_time,
    place,
    description,
    teacherIds = [],
    classNames = []
  } = req.body;

  try {
    await db.query(
      `UPDATE events
       SET title=?, event_date=?, event_time=?, place=?, description=?
       WHERE id=?`,
      [title, event_date, event_time || null, place || null, description || null, eventId]
    );

    // vymazať staré vzťahy
    await db.query("DELETE FROM event_teachers WHERE event_id = ?", [eventId]);
    await db.query("DELETE FROM event_classes WHERE event_id = ?", [eventId]);

    // nove
    for (const teacherId of teacherIds) {
      await db.query(
        "INSERT INTO event_teachers (event_id, teacher_id) VALUES (?, ?)",
        [eventId, teacherId]
      );
    }

    for (const className of classNames) {
      await db.query(
        "INSERT INTO event_classes (event_id, class_name) VALUES (?, ?)",
        [eventId, className]
      );
    }

    res.json({ message: "Udalosť aktualizovaná" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba pri úprave udalosti" });
  }
};

// vzmazať udalosť
exports.deleteEvent = async (req, res) => {
  const eventId = req.params.id;

  try {
    await db.query("DELETE FROM event_teachers WHERE event_id = ?", [eventId]);
    await db.query("DELETE FROM event_students WHERE event_id = ?", [eventId]);
    await db.query("DELETE FROM event_classes WHERE event_id = ?", [eventId]);
    await db.query("DELETE FROM events WHERE id = ?", [eventId]);

    res.json({ message: "Udalosť zmazaná" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba pri mazaní udalosti" });
  }
};
