CREATE TABLE calendar
(
  id INT NOT NULL IDENTITY(1,1) PRIMARY KEY NONCLUSTERED,
  service_id VARCHAR(100) NOT NULL,
  monday BIT NOT NULL,
  tuesday BIT NOT NULL,
  wednesday BIT NOT NULL,
  thursday BIT NOT NULL,
  friday BIT NOT NULL,
  saturday BIT NOT NULL,
  sunday BIT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  import_package VARCHAR(50),
);

CREATE CLUSTERED INDEX IX_Calendar_service_id
ON calendar (service_id);

CREATE NONCLUSTERED INDEX IX_Calendar_start_date_end_date
ON calendar (start_date, end_date);
