CREATE TABLE temp_frequencies
(
  id INT NOT NULL IDENTITY(1,1) PRIMARY KEY NONCLUSTERED,
  trip_id VARCHAR(100) NOT NULL,
  start_time TIME(0) NOT NULL,
  end_time TIME(0) NOT NULL,
  headway_sec INT NOT NULL,
  exact_times INT,
  import_package VARCHAR(50),
);