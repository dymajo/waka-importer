import { Table, VarChar, Bit, Int, Date as _Date, Time, Decimal } from 'mssql'
import csvparse from 'csv-parse'
import transform from 'stream-transform'
import { createReadStream } from 'fs'
import { resolve as _resolve } from 'path'
import connection from './connection'
import log from '../logger'
import config from '../config'
import schemas from './schemas'
import {
  agencyCreator,
  stopsCreator,
  routesCreator,
  tripsCreator,
  stopTimesCreator,
  calendarCreator,
  calendarDatesCreator,
} from './tableCreator'
const primaryKeys = {
  agency: 'agency_id',
  stops: 'stop_id',
  routes: 'route_id',
  trips: 'trip_id',
  stop_times: 'trip_id',
  calendar: 'service_id',
  calendar_dates: 'service_id',
}

class GtfsImport {
  getTable(name: string, hashName?: string, hash = false) {
    let newName = name
    if (hash) {
      newName = `${hashName}`
    }
    const table = new Table(newName)
    if (hash) {
      table.create = true
    }
    if (name === 'agency') {
      agencyCreator(table)
    } else if (name === 'stops') {
      stopsCreator(table)
    } else if (name === 'routes') {
      routesCreator(table)
    } else if (name === 'trips') {
      tripsCreator(table)
    } else if (name === 'stop_times') {
      stopTimesCreator(table)
    } else if (name === 'calendar') {
      calendarCreator(table)
    } else if (name === 'calendar_dates') {
      calendarDatesCreator(table)
    } else {
      return null
    }
    return table
  }

  _mapRowToRecord(
    row: any[],
    rowSchema: { [key: string]: number },
    tableSchema: string[]
  ) {
    let arrival_time_24 = false
    let departure_time_24 = false
    return tableSchema.map(column => {
      if (
        column === 'date' ||
        column === 'start_date' ||
        column === 'end_date'
      ) {
        const stringDate = row[rowSchema[column]]
        const date = new Date(0)
        date.setUTCFullYear(stringDate.slice(0, 4))
        date.setUTCMonth(parseInt(stringDate.slice(4, 6), 10) - 1) // dates start from 0??
        date.setUTCDate(stringDate.slice(6, 8))
        return date
        // i hate this library
      }
      const dayOfTheWeek = (column: string) =>
        column === 'monday' ||
        column === 'tuesday' ||
        column === 'wednesday' ||
        column === 'thursday' ||
        column === 'friday' ||
        column === 'saturday' ||
        column === 'sunday'
      if (dayOfTheWeek(column)) {
        return row[rowSchema[column]] === '1'
      }
      if (column === 'arrival_time' || column === 'departure_time') {
        const splitRow = row[rowSchema[column]].split(':')
        // modulo and set the bit
        if (parseInt(splitRow[0], 10) >= 24) {
          splitRow[0] %= 24
          if (column === 'arrival_time') {
            arrival_time_24 = true
          } else if (column === 'departure_time') {
            departure_time_24 = true
          }
        }
        const result = new Date(0)
        result.setUTCHours(splitRow[0])
        result.setUTCMinutes(splitRow[1])
        result.setUTCSeconds(splitRow[2])
        return result
      }
      if (column === 'arrival_time_24') {
        return arrival_time_24
      }
      if (column === 'departure_time_24') {
        return departure_time_24
      }
      if (column === 'route_short_name' && row[rowSchema[column]] === '') {
        row[rowSchema[column]] = row[rowSchema.route_long_name].split(' ')[0]
      }
      return row[rowSchema[column]] || null
    })
  }

  async upload(
    location: string,
    file: {
      table:
        | 'agency'
        | 'stops'
        | 'routes'
        | 'trips'
        | 'stop_times'
        | 'calendar'
        | 'calendar_dates'
      name: string
    },
    version: string,
    containsVersion: boolean,
    endpoint?: string,
    merge: boolean = false
  ) {
    let table = merge
      ? this.getTable(file.table, `temp_${file.table}`, true)
      : this.getTable(file.table)
    if (table === null) return null
    const logstr = file.table.toString()
    return new Promise((resolve, reject) => {
      const input = createReadStream(_resolve(location, file.name))
      input.on('error', reject)
      const parser = csvparse({ delimiter: ',' })
      let headers: { [key: string]: number } = null
      let transactions = 0
      let totalTransactions = 0

      const transformer = transform(
        async (row, callback) => {
          // builds the csv headers for easy access later
          if (headers === null) {
            headers = {}
            row.forEach((item, index) => {
              headers[item] = index
            })
            return callback(null)
          }

          const processRow = async () => {
            if (row && row.length > 1) {
              const tableSchema = schemas[file.table]
              if (tableSchema) {
                const record = this._mapRowToRecord(row, headers, tableSchema)

                // check if the row is versioned, and whether to upload it
                if (
                  containsVersion &&
                  record.join(',').match(version) === null
                ) {
                  return
                }

                table.rows.add(...record)

                transactions += 1
                totalTransactions += 1
              }
            }
          }

          // assembles our CSV into JSON
          if (transactions < config.db.transactionLimit) {
            processRow()
            callback(null)
          } else {
            log(endpoint, logstr, `${totalTransactions / 1000}k Rows`)
            try {
              await this.commit(table)
              log(endpoint, logstr, 'Transaction Committed.')
              transactions = 0

              table = this.getTable(file.table)
              processRow()
              callback(null)
            } catch (err) {
              console.log(err)
            }
          }
        },
        { parallel: 1 }
      )
      transformer.on('finish', async () => {
        const transactionsStr =
          totalTransactions > 1000
            ? `${Math.round(totalTransactions / 1000)}k`
            : `${totalTransactions}`
        log(endpoint, logstr, transactionsStr, 'Rows')
        try {
          await this.commit(table)

          log(endpoint, logstr, 'Transaction Committed.')
          if (merge) {
            await this.mergeToFinal(file.table)
            log(endpoint, logstr, 'Merge Committed.')
          }
          resolve()
        } catch (error) {
          reject(error)
        }
      })

      input.pipe(parser).pipe(transformer)
    })
  }

  async commit(table: Table) {
    try {
      const result = await connection
        .get()
        .request()
        .bulk(table)
    } catch (error) {
      console.error(error)
    }
  }

  async mergeToFinal(
    table:
      | 'agency'
      | 'stops'
      | 'routes'
      | 'trips'
      | 'stop_times'
      | 'calendar'
      | 'calendar_dates'
  ) {
    const hashTable = `temp_${table}`
    const primaryKey = primaryKeys[table]
    const sqlRequest = connection.get().request()
    const columns = schemas[table].join()
    const insertColumns = schemas[table].map(col => `H.${col}`).join()

    const merge = await sqlRequest.query(
      `MERGE
        INTO ${table} as T
        USING ${hashTable} AS H
        ON T.${primaryKey} = H.${primaryKey}
        WHEN NOT MATCHED BY TARGET
          THEN INSERT (${columns})
            VALUES (${insertColumns});
      TRUNCATE TABLE ${hashTable}



   `
    )
    // DROP TABLE ${hashTable};
  }
}
export default GtfsImport
