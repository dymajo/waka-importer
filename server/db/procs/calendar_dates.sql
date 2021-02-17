CREATE TABLE calendar_dates
(
  id int NOT NULL IDENTITY(1,1) PRIMARY KEY NONCLUSTERED,
  service_id VARCHAR(100) NOT NULL,
  date date NOT NULL,
  exception_type int NOT NULL,
  import_package VARCHAR(50),
);

CREATE CLUSTERED INDEX IX_Calendar_Dates_service_id
ON calendar_dates (service_id);

CREATE NONCLUSTERED INDEX IX_Calendar_Dates_service_id_date
ON calendar_dates (service_id, date);
