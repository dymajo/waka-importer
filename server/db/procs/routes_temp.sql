CREATE TABLE temp_routes
(
  id INT NOT NULL IDENTITY(1,1) PRIMARY KEY NONCLUSTERED,
  route_id VARCHAR(100) NOT NULL,
  agency_id VARCHAR(100),
  route_short_name VARCHAR(50) NOT NULL,
  route_long_name VARCHAR(150),
  route_desc VARCHAR(1000),
  route_type INT NOT NULL,
  route_url VARCHAR(150),
  route_color VARCHAR(50) DEFAULT 'FFFFFF',
  route_text_color VARCHAR(50) DEFAULT '000000',
  import_package VARCHAR(50),
  CONSTRAINT uc_temp_Routes UNIQUE (route_id)
);
