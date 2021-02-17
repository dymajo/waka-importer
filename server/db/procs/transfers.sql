CREATE TABLE transfers
(
  id int NOT NULL IDENTITY(1,1) PRIMARY KEY,
  from_stop_id VARCHAR(100) NOT NULL,
  to_stop_id VARCHAR(100) NOT NULL,
  transfer_type int not null,
  min_transfer_time int,
  import_package VARCHAR(50),
)