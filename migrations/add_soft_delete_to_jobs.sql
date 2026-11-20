USE jobboard;

-- Soft delete: rows are never removed, just marked with when and by whom
ALTER TABLE jobs
  ADD COLUMN deleted_at DATETIME NULL AFTER updated_at,
  ADD COLUMN deleted_by INT NULL AFTER deleted_at;

-- is_active is 1 while the job is live and NULL once it is soft-deleted.
-- MySQL allows any number of NULLs in a UNIQUE key, so deleted jobs
-- no longer block posting the same title + company + location again.
ALTER TABLE jobs
  ADD COLUMN is_active TINYINT GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED;

ALTER TABLE jobs
  DROP INDEX uq_jobs_title_company_location,
  ADD UNIQUE KEY uq_jobs_title_company_location_active (title, company, location, is_active);
