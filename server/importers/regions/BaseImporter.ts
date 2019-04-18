import { join } from 'path'
import * as request from 'request'
import { createWriteStream } from 'fs'
import log from '../../logger'
import config from '../../config'

abstract class BaseImporter {
  async postImport?(): Promise<void>

  zipname: string
  url: string

  files: [
    {
      name: 'agency.txt'
      table: 'agency'
      versioned: false
    },
    {
      name: 'stops.txt'
      table: 'stops'
      versioned: false
    },
    {
      name: 'routes.txt'
      table: 'routes'
      versioned: false
    },
    {
      name: 'trips.txt'
      table: 'trips'
      versioned: false
    },
    {
      name: 'stop_times.txt'
      table: 'stop_times'
      versioned: false
    },
    {
      name: 'calendar.txt'
      table: 'calendar'
      versioned: false
    },
    {
      name: 'calendar_dates.txt'
      table: 'calendar_dates'
      versioned: false
    }
  ]
  shapeFile: 'shapes.txt'
  download() {
    return new Promise((resolve, reject) => {
      log(config.prefix.magenta, 'Downloading GTFS Data')
      const gtfsRequest = request(this.downloadOptions).pipe(
        createWriteStream(this.zipLocation)
      )
      gtfsRequest.on('finish', () => {
        log('Finished Downloading GTFS Data')
        resolve()
      })
      gtfsRequest.on('error', reject)
    })
  }
  zipLocation = join(__dirname, `../../cache/${this.zipname}.zip`)
  downloadOptions = { url: this.url }
}

export default BaseImporter
