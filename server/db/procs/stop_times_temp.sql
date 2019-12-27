CREATE TABLE temp_stop_times
(
  id INT NOT NULL IDENTITY(1,1) PRIMARY KEY NONCLUSTERED,
  trip_id VARCHAR(100) NOT NULL,
  arrival_time TIME(0) NOT NULL,
  departure_time TIME(0) NOT NULL,
  arrival_time_24 BIT NOT NULL,
  departure_time_24 BIT NOT NULL,
  stop_id VARCHAR(100) NOT NULL,
  stop_sequence INT NOT NULL,
  stop_headsign VARCHAR(100),
  pickup_type INT DEFAULT 0,
  drop_off_type INT DEFAULT 0,
  shape_dist_traveled FLOAT,
  timepoint INT,
  import_package VARCHAR(50),
);
