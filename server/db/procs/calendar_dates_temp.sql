CREATE TABLE temp_calendar_dates
(
  id INT NOT NULL IDENTITY(1,1) PRIMARY KEY NONCLUSTERED,
  service_id VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  exception_type INT NOT NULL,
  import_package VARCHAR(50),
);
