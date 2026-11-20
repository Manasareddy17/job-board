CREATE DATABASE IF NOT EXISTS jobboard;
USE jobboard;

CREATE TABLE IF NOT EXISTS jobs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(120) NOT NULL,
  company      VARCHAR(120) NOT NULL,
  location     VARCHAR(80)  NOT NULL,
  type         ENUM('FULL_TIME', 'PART_TIME', 'INTERNSHIP') NOT NULL,
  salary_min   INT UNSIGNED NULL,
  salary_max   INT UNSIGNED NULL,
  description  TEXT NULL,
  notified_at  DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_jobs_title_company_location (title, company, location),
  KEY idx_jobs_type (type),
  KEY idx_jobs_created_at (created_at)
);
