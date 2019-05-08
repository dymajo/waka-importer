import { readFileSync } from 'fs'
import { resolve } from 'path'
import log from '../logger'
import connection from './connection'
const createAgencyTable = async () => {
  return connection
    .get()
    .request()
    .batch(readFileSync(resolve(__dirname, './procs/agency.sql')).toString())
}

const createStopsTable = async () => {
  return connection
    .get()
    .request()
    .batch(readFileSync(resolve(__dirname, './procs/stops.sql')).toString())
}

const createRoutesTable = async () => {
  return connection
    .get()
    .request()
    .batch(readFileSync(resolve(__dirname, './procs/routes.sql')).toString())
}

const createTripsTables = async () => {
  return connection
    .get()
    .request()
    .batch(readFileSync(resolve(__dirname, './procs/trips.sql')).toString())
}

const createStopTimesTable = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(resolve(__dirname, './procs/stop_times.sql')).toString()
    )
}
const createCalendarTable = async () => {
  return connection
    .get()
    .request()
    .batch(readFileSync(resolve(__dirname, './procs/calendar.sql')).toString())
}

const createCalendarDatesTable = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(resolve(__dirname, './procs/calendar_dates.sql')).toString()
    )
}
const createTempCalendarTable = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(resolve(__dirname, './procs/temp_calendar.sql')).toString()
    )
}
const createTempStopTimesTable = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(resolve(__dirname, './procs/temp_stop_times.sql')).toString()
    )
}

const createTempCalendarDates = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(
        resolve(__dirname, './procs/temp_calendar_dates.sql')
      ).toString()
    )
}

const createTempAgencyTable = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(resolve(__dirname, './procs/temp_agency.sql')).toString()
    )
}
const createTempStopsTable = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(resolve(__dirname, './procs/temp_stops.sql')).toString()
    )
}
const createTempRoutesTable = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(resolve(__dirname, './procs/temp_routes.sql')).toString()
    )
}
const createTempTripsTable = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(resolve(__dirname, './procs/temp_trips.sql')).toString()
    )
}

const createStopTimesStoredProc = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(resolve(__dirname, './procs/GetStopTimes.sql')).toString()
    )
}
const createMultipleStopTimesStoredProc = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(
        resolve(__dirname, './procs/GetMultipleStopTimes.sql')
      ).toString()
    )
}
const createTimetableStoredProc = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(resolve(__dirname, './procs/GetTimetable.sql')).toString()
    )
}
const createMultipleTimetableStoredProc = async () => {
  return connection
    .get()
    .request()
    .batch(
      readFileSync(
        resolve(__dirname, './procs/GetMultipleTimetable.sql')
      ).toString()
    )
}

const create = async () => {
  log('Creating Tables...')
  await createAgencyTable()
  await createStopsTable()
  await createRoutesTable()
  await createTripsTables()
  await createStopTimesTable()
  await createCalendarTable()
  await createCalendarDatesTable()
  await createTempStopTimesTable()
  await createTempAgencyTable()
  await createTempStopsTable()
  await createTempRoutesTable()
  await createTempTripsTable()
  await createTempCalendarTable()
  await createTempCalendarDates()
  log('Creating Stored Procedures...')
  await createStopTimesStoredProc()
  await createMultipleStopTimesStoredProc()
  await createTimetableStoredProc()
  await createMultipleTimetableStoredProc()
  log('Database Created')
}

class CreateDB {
  start() {
    return create()
  }
}
export default CreateDB
