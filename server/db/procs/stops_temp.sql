CREATE TABLE temp_stops
(
  id int NOT NULL IDENTITY(1,1) PRIMARY KEY NONCLUSTERED,
  stop_id VARCHAR(100) NOT NULL,
  stop_code VARCHAR(100),
  stop_name VARCHAR(100) NOT NULL,
  stop_desc VARCHAR(1000),
  stop_lat decimal(10,6) NOT NULL,
  stop_lon decimal(10,6) NOT NULL,
  zone_id VARCHAR(50),
  stop_url VARCHAR(1000),
  location_type int,
  parent_station VARCHAR(100),
  stop_timezone VARCHAR(100),
  wheelchair_boarding int,
  import_package VARCHAR(50),
  CONSTRAINT uc_temp_Stops UNIQUE (stop_id)
);
