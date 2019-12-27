CREATE TABLE agency
(
  id INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
  agency_id VARCHAR(100) NOT NULL,
  agency_name VARCHAR(100) NOT NULL,
  agency_url VARCHAR(100) NOT NULL,
  agency_timezone VARCHAR(100) NOT NULL,
  agency_lang VARCHAR(50),
  agency_phone VARCHAR(50),
  agency_fare_url VARCHAR(100),
  agency_email VARCHAR(50),
  import_package VARCHAR(50),
  CONSTRAINT uc_Agency UNIQUE (agency_id)
)