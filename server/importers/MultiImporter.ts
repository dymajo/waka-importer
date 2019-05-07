import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import axios from 'axios'
import extract from 'extract-zip'
import util from 'util'

import colors from 'colors'
import log from '../logger.js'
import GtfsImport from '../db/gtfs-import.js'
import CreateShapes from '../db/create-shapes.js'
import connection from '../db/connection.js'
import Storage from '../db/storage.js'
import KeyvalueDynamo from '../db/keyvalue-dynamo.js'
import config from '../config'

const shapeFile = 'shapes.txt'

interface IMultiImporterProps {
  keyvalue?: string
  keyvalueVersionTable?: string
  keyvalueRegion?: string
  locations: { endpoint: string; type: string; name: string }[]
  downloadInterval?: number
  batchSize?: number
  authorization?: string
}

abstract class MultiImporter {
  postImport?(): void

  locations: any
  authorization: any
  importer: any
  storage: Storage
  downloadInterval: any
  batchSize: any
  versions: any
  zipLocations: any[]
  files: {
    name: string
    table:
      | 'agency'
      | 'stops'
      | 'routes'
      | 'trips'
      | 'stop_times'
      | 'calendar'
      | 'calendar_dates'
    versioned: boolean
  }[]
  constructor(props: IMultiImporterProps) {
    const {
      keyvalue,
      keyvalueVersionTable,
      keyvalueRegion,
      locations,
      downloadInterval,
      batchSize,
      authorization,
    } = props

    this.locations = locations
    this.authorization = authorization
    this.importer = new GtfsImport()
    this.storage = new Storage({})
    this.downloadInterval = downloadInterval || 2000
    this.batchSize = batchSize || 2
    this.versions = null
    this.zipLocations = []
    this.files = [
      {
        name: 'agency.txt',
        table: 'agency',
        versioned: false,
      },
      {
        name: 'stops.txt',
        table: 'stops',
        versioned: false,
      },
      {
        name: 'routes.txt',
        table: 'routes',
        versioned: false,
      },
      {
        name: 'trips.txt',
        table: 'trips',
        versioned: false,
      },
      {
        name: 'stop_times.txt',
        table: 'stop_times',
        versioned: false,
      },
      {
        name: 'calendar.txt',
        table: 'calendar',
        versioned: false,
      },
      {
        name: 'calendar_dates.txt',
        table: 'calendar_dates',
        versioned: false,
      },
    ]
    if (keyvalue === 'dynamo') {
      this.versions = new KeyvalueDynamo({
        name: keyvalueVersionTable,
        region: keyvalueRegion,
      })
    }
  }

  async start(created = false) {
    if (!created) {
      await this.download()
      console.log(this.zipLocations)
      await this.unzip()
      await this.db()
    } else {
      console.warn('DB already created - skipping download & unzip.')
    }
    await this.shapes()
    await this.fixStopCodes()
    await this.fixRoutes()
  }

  async get(location: { endpoint: string; type: string; name: string }) {
    const { endpoint, type, name } = location
    const { authorization } = this
    const zipLocation = {
      p: path.join(__dirname, `../../cache/${name}.zip`),
      type,
      endpoint,
    }
    console.log(zipLocation)
    log(config.prefix.magenta, 'Downloading GTFS Data', name)
    try {
      const res = await axios.get(endpoint, {
        headers: { Authorization: authorization },
      })
      const dest = fs.createWriteStream(zipLocation.p)
      res.data.pipe(dest)
      log(config.prefix.magenta, 'Finished Downloading GTFS Data', name)
      this.zipLocations.push(zipLocation)
      return
    } catch (err) {
      console.error(err)
    }
  }

  async download() {
    const { downloadInterval, locations, batchSize } = this
    function timeout(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
    console.log(batchSize, downloadInterval)
    for (let index = 0; index < locations.length; index++) {
      const location = locations[index]
      await this.get(location)
      if (index % batchSize === 0) {
        await timeout(downloadInterval)
      }
    }
  }

  async unzip() {
    const promises = []
    for (const { p } of this.zipLocations) {
      const extractor = util.promisify(extract)

      promises.push(
        extractor(p, {
          dir: path.resolve(`${p}unarchived`),
        })
      )
    }
    try {
      await Promise.all(promises)
    } catch (error) {
      log('fatal error'.red, error)
    }
  }

  async db() {
    const { zipLocations, files } = this
    for (const { p, type, endpoint } of zipLocations) {
      for (const file of files) {
        try {
          await this.importer.upload(
            `${p}unarchived`,
            file,
            config.version,
            file.versioned,
            endpoint,
            true
          )
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  async shapes() {
    const { zipLocations } = this
    for (const { p } of zipLocations) {
      if (!fs.existsSync(p)) {
        console.warn('Shapes could not be found!')
        return
      }
      const creator = new CreateShapes()
      const inputDir = path.resolve(`${p}unarchived`, 'shapes.txt')
      const outputDir = path.resolve(`${p}unarchived`, 'shapes')
      const outputDir2 = path.resolve(outputDir, config.version)

      // make sure the old output dir exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir)
      }

      // cleans up old import if exists
      if (fs.existsSync(outputDir2)) {
        await new Promise((resolve, reject) => {
          rimraf(outputDir2, resolve)
        })
      }
      fs.mkdirSync(outputDir2)

      // creates the new datas
      await creator.create(inputDir, outputDir, [config.version])

      const containerName = `${config.prefix}-${config.version}`
        .replace('.', '-')
        .replace('_', '-')
      await creator.upload(
        config.shapesContainer,
        path.resolve(outputDir, config.version)
      )
    }
  }

  async fixStopCodes() {
    // GTFS says it's optional, but Waka uses stop_code for stop lookups
    const sqlRequest = connection.get().request()
    const res = await sqlRequest.query(`
      UPDATE stops
      SET stop_code = stop_id
      WHERE stop_code is null;
    `)
    const rows = res.rowsAffected[0]
    log(
      `${config.prefix} ${config.version}`.magenta,
      `Updated ${rows} null stop codes`
    )
  }

  async fixRoutes() {
    const sqlRequest = connection.get().request()
    const res = await sqlRequest.query(`
      UPDATE routes
      SET route_long_name = route_short_name
      WHERE route_long_name is null;
    `)
    const rows = res.rowsAffected[0]
    log(
      `${config.prefix} ${config.version}`.magenta,
      `Updated ${rows} null route codes`
    )
  }
}

export default MultiImporter
