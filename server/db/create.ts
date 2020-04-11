import { readFileSync } from 'fs'
import { resolve } from 'path'
import logger from '../logger'
import connection from './connection'
import config from '../config'

const log = logger(config.prefix, config.version)

const tables = [
  'agency.sql',
  'stops.sql',
  'routes.sql',
  'trips.sql',
  'stop_times.sql',
  'calendar.sql',
  'calendar_dates.sql',
  'transfers.sql',
  'frequencies.sql',
]

const tempTables = [
  'calendar_temp.sql',
  'stop_times_temp.sql',
  'calendar_dates_temp.sql',
  'agency_temp.sql',
  'stops_temp.sql',
  'routes_temp.sql',
  'trips_temp.sql',
  'frequencies_temp.sql',
]

const procs = [
  'GetStopTimes.sql',
  'GetTimetable.sql',
  'alphasort.sql',
  'GetRoutes.sql',
  'GetMultiStopTimes.sql',
]

const create = async (filenames: string[]) => {
  await Promise.all(
    filenames.map((filename) => {
      return connection
        .get()
        .request()
        .batch(
          readFileSync(resolve(__dirname, './procs/', filename)).toString(),
        )
    }),
  )
}

class CreateDB {
  public start = async () => {
    log.info('Creating Tables...')
    await create(tables)
    log.info('Creating temp tables...')
    await create(tempTables)
    log.info('Creating Stored Procedures...')
    await create(procs)
    log.info('Database Created')
  }
}
export default CreateDB
