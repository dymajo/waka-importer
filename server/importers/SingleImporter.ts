import { resolve as _resolve, join } from 'path'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import rimraf from 'rimraf'
import extract from 'extract-zip'
import axios from 'axios'
import BaseImporter from './BaseImporter'

import config from '../config'
import logger from '../logger'
import CreateShapes from '../db/create-shapes'
import GtfsImport from '../db/gtfs-import'

const log = logger(config.prefix, config.version)

interface SingleImporterProps {
  zipname: string
  url: string
}

abstract class SingleImporter extends BaseImporter {
  private readonly zipname: string
  private readonly url: string
  private readonly zipLocation: string
  private readonly downloadOptions: { url: string }
  public constructor(props: SingleImporterProps) {
    super()
    const { zipname, url } = props
    this.zipname = zipname
    this.url = url

    this.zipLocation = join(__dirname, `../../cache/${this.zipname}.zip`)
    this.downloadOptions = { url: this.url }
  }

  public download = async () => {
    try {
      log.info('Downloading GTFS Data')
      const res = await axios.get(this.downloadOptions.url, {
        responseType: 'stream',
      })
      const dest = createWriteStream(this.zipLocation)
      res.data.pipe(dest)
      await new Promise<void>((resolve, reject) => {
        dest.on('finish', () => {
          log.info('Finished Downloading GTFS Data')
          resolve()
        })
        dest.on('error', reject)
      })
    } catch (error) {
      log.error(error)
    }
  }

  public unzip = async () => {
    log.info('Unzipping GTFS Data')
    const { zipLocation } = this
    return new Promise<void>((resolve, reject) => {
      extract(
        zipLocation,
        {
          dir: _resolve(`${zipLocation}unarchived`),
        },
        err => {
          if (err !== undefined) {reject(err)}
          resolve()
        },
      )
    })
  }

  public db = async (importer: GtfsImport) => {
    for (const file of this.files) {
      try {
        await importer.upload(
          `${this.zipLocation}unarchived`,
          file,
          config.version,
          file.versioned,
          config.prefix,
        )
      } catch (error) {
        log.error(error)
      }
    }
  }

  public shapes = async () => {
    if (!existsSync(this.zipLocation)) {
      log.error('Shapes could not be found!')
      return
    }

    const creator = new CreateShapes()
    const inputDir = _resolve(`${this.zipLocation}unarchived`, 'shapes.txt')
    const outputDir = _resolve(`${this.zipLocation}unarchived`, 'shapes')
    const outputDir2 = _resolve(outputDir, config.version)

    // make sure the old output dir exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir)
    }

    // cleans up old import if exists
    if (existsSync(outputDir2)) {
      await new Promise<void>((resolve, reject) => {
        rimraf(outputDir2, err => {
          if (err !== undefined) {reject(err)}
          resolve()
        })
      })
    }
    mkdirSync(outputDir2)

    // creates the new datas
    await creator.create(inputDir, outputDir, [config.version], config.prefix)

    const containerName = `${config.prefix}-${config.version}`
      .replace('.', '-')
      .replace('_', '-')
    await creator.upload(
      config.shapesContainer !== undefined
        ? config.shapesContainer
        : containerName,
      _resolve(outputDir, config.version),
      config.prefix,
    )
  }
}

export default SingleImporter
