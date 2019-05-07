import { existsSync, createWriteStream, mkdirSync, writeFileSync } from 'fs'
import { resolve as _resolve, join } from 'path'
import * as rimraf from 'rimraf'
import axios from 'axios'
import * as extract from 'extract-zip'
import { promisify } from 'util'
import { red } from 'colors'
import log from '../logger.js'
import GtfsImport from '../db/gtfs-import.js'
import CreateShapes from '../db/create-shapes.js'
import connection from '../db/connection.js'
import Storage from '../db/storage.js'
import KeyvalueDynamo from '../db/keyvalue-dynamo.js'
import config from '../config'
import BaseImporter from './BaseImporter.js';


interface IMultiImporterProps {
  keyvalue?: string
  keyvalueVersionTable?: string
  keyvalueRegion?: string
  locations: { endpoint: string; type: string; name: string }[]
  downloadInterval?: number
  batchSize?: number
  authorization?: string
}

abstract class MultiImporter extends BaseImporter {

  locations: any
  authorization: any
  importer: any
  storage: Storage
  downloadInterval: any
  batchSize: any
  versions: any
  zipLocations: any[]

  constructor(props: IMultiImporterProps) {
    super()
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

    if (keyvalue === 'dynamo') {
      this.versions = new KeyvalueDynamo({
        name: keyvalueVersionTable,
        region: keyvalueRegion,
      })
    }
  }

  async get(location: { endpoint: string; type: string; name: string }) {
    const { endpoint, type, name } = location
    const { authorization } = this
    const zipLocation = {
      p: join(__dirname, `../../cache/${name}.zip`),
      type,
      endpoint,
    }
    log(config.prefix.magenta, 'Downloading GTFS Data', name)
    try {
      const res = await axios.get(endpoint, {
        headers: { Authorization: authorization },
        responseType: 'stream',
      })
      const dest = createWriteStream(zipLocation.p)
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
      const extractor = promisify(extract.default)

      promises.push(
        extractor(p, {
          dir: _resolve(`${p}unarchived`),
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
      if (!existsSync(p)) {
        console.warn('Shapes could not be found!')
        return
      }
      const creator = new CreateShapes()
      const inputDir = _resolve(`${p}unarchived`, 'shapes.txt')
      const outputDir = _resolve(`${p}unarchived`, 'shapes')
      const outputDir2 = _resolve(outputDir, config.version)

      // make sure the old output dir exists
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir)
      }

      // cleans up old import if exists
      if (existsSync(outputDir2)) {
        await new Promise((resolve, reject) => {
          rimraf(outputDir2, resolve)
        })
      }
      mkdirSync(outputDir2)

      // creates the new datas
      await creator.create(inputDir, outputDir, [config.version])

      const containerName = `${config.prefix}-${config.version}`
        .replace('.', '-')
        .replace('_', '-')
      await creator.upload(
        config.shapesContainer,
        _resolve(outputDir, config.version)
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
