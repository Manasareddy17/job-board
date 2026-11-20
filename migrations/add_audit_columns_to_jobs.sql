USE jobboard;

-- Who created / last changed each job (user id sent by the gateway)
ALTER TABLE jobs
  ADD COLUMN created_by INT NULL AFTER description,
  ADD COLUMN updated_by INT NULL AFTER created_by;
