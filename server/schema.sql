CREATE DATABASE IF NOT EXISTS wattwise
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE wattwise;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS buildings (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_buildings_name (name),
  UNIQUE KEY uq_buildings_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reporter_id BIGINT UNSIGNED NOT NULL,
  building_id SMALLINT UNSIGNED NOT NULL,
  room VARCHAR(120) NOT NULL,
  issue_type ENUM(
    'Lights left on',
    'Fans running in an empty room',
    'AC running with windows open',
    'Equipment left on standby',
    'Other energy waste'
  ) NOT NULL,
  details TEXT NULL,
  photo_data MEDIUMTEXT NULL,
  status ENUM('open', 'check', 'done') NOT NULL DEFAULT 'open',
  response TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reports_status_created (status, created_at),
  KEY idx_reports_building_status (building_id, status),
  KEY idx_reports_reporter_created (reporter_id, created_at),
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_reports_building FOREIGN KEY (building_id) REFERENCES buildings(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS report_updates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED NOT NULL,
  old_status ENUM('open', 'check', 'done') NULL,
  new_status ENUM('open', 'check', 'done') NOT NULL,
  response TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_report_updates_report_created (report_id, created_at),
  CONSTRAINT fk_updates_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_updates_actor FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB;

INSERT IGNORE INTO buildings (name, code) VALUES
  ('Library', 'LIB'),
  ('Science Block', 'SCI'),
  ('Student Centre', 'STU'),
  ('Residence Hall', 'RES');
