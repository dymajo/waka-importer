CREATE TABLE trips
(
  id INT NOT NULL IDENTITY(1,1) PRIMARY KEY NONCLUSTERED,
  route_id VARCHAR(100) NOT NULL,
  service_id VARCHAR(100) NOT NULL,
  trip_id VARCHAR(100) NOT NULL,
  trip_headsign VARCHAR(100),
  trip_short_name VARCHAR(50),
  direction_id INT,
  block_id VARCHAR(100),
  shape_id VARCHAR(100),
  wheelchair_accessible INT,
  bikes_allowed INT,
  consist INT,
  set_type VARCHAR(50),
  import_package VARCHAR(50),
  CONSTRAINT uc_Trips UNIQUE (trip_id)
);

CREATE CLUSTERED INDEX IX_Trips_trip_id
ON trips (trip_id);

CREATE NONCLUSTERED INDEX IX_Trips_route_id
ON trips (route_id);

CREATE NONCLUSTERED INDEX IX_Trips_service_id
ON trips (service_id);
