import path from 'path'
import request from 'request'
import fs from 'fs'
import colors from 'colors'
import extract from 'extract-zip'
import util from 'util'
import rimraf from 'rimraf'
import config from '../config'
import log from '../logger.js'
import CreateShapes from '../db/create-shapes.js'
import Importer from '.'
import GtfsImport from '../db/gtfs-import'

interface IBaseImporterProps {
  zipname: string
  url: string
}

abstract class BaseImporter {
  postImport?(): void
  zipname: string
  url: string
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
  shapeFile: string
  zipLocation: string
  downloadOptions: { url: any }
  constructor(props: IBaseImporterProps) {
    const { zipname, url } = props
    this.zipname = zipname
    this.url = url

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
    this.shapeFile = 'shapes.txt'
    this.zipLocation = path.join(__dirname, `../../cache/${this.zipname}.zip`)
    this.downloadOptions = { url: this.url }
  }

  download() {
    return new Promise((resolve, reject) => {
      log(config.prefix.magenta, 'Downloading GTFS Data')
      const gtfsRequest = request(this.downloadOptions).pipe(
        fs.createWriteStream(this.zipLocation)
      )
      gtfsRequest.on('finish', () => {
        log('Finished Downloading GTFS Data')
        resolve()
      })
      gtfsRequest.on('error', reject)
    })
  }

  async unzip() {
    log('Unzipping GTFS Data')
    const { zipLocation } = this
    const extractor = util.promisify(extract)

    await extractor(zipLocation, {
      dir: path.resolve(`${zipLocation}unarchived`),
    })
  }

  async db(importer: GtfsImport) {
    for (const file of this.files) {
      await importer.upload(
        `${this.zipLocation}unarchived`,
        file,
        config.version,
        file.versioned
      )
    }
  }

  async shapes() {
    if (!fs.existsSync(this.zipLocation)) {
      console.warn('Shapes could not be found!')
      return
    }

    const creator = new CreateShapes()
    const inputDir = path.resolve(`${this.zipLocation}unarchived`, 'shapes.txt')
    const outputDir = path.resolve(`${this.zipLocation}unarchived`, 'shapes')
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

export default BaseImporter
