USE sps_nastenka;


DROP TABLE IF EXISTS event_students;
DROP TABLE IF EXISTS event_classes;
DROP TABLE IF EXISTS event_teachers;
DROP TABLE IF EXISTS Events;

CREATE TABLE Events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NULL,
  place VARCHAR(200) NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE event_teachers (
  event_id INT NOT NULL,
  teacher_id INT NOT NULL,
  PRIMARY KEY (event_id, teacher_id),
  FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES Teachers(id) ON DELETE CASCADE
);


CREATE TABLE event_classes (
  event_id INT NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  PRIMARY KEY (event_id, class_name),
  FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE
);


CREATE TABLE event_students (
  event_id INT NOT NULL,
  student_id INT NOT NULL,
  PRIMARY KEY (event_id, student_id),
  FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
