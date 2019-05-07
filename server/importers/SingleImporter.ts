import BaseImporter from "./BaseImporter";


import { resolve as _resolve, join } from 'path'
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'fs'
import * as colors from 'colors'

import { promisify } from 'util'
import * as rimraf from 'rimraf'
import * as extract from 'extract-zip'
import config from '../config'
import log from '../logger.js'
import CreateShapes from '../db/create-shapes.js'
import Importer from '.'
import GtfsImport from '../db/gtfs-import'
import axios from 'axios'

interface ISingleImporterProps {
  zipname: string
  url: string
}

abstract class SingleImporter extends BaseImporter {
  zipname: string
  url: string

  zipLocation: string
  downloadOptions: { url: any }
  constructor(props: ISingleImporterProps) {
    super()
    const { zipname, url } = props
    this.zipname = zipname
    this.url = url


    this.zipLocation = join(__dirname, `../../cache/${this.zipname}.zip`)
    this.downloadOptions = { url: this.url }
  }

  async download() {
    try {
      log(config.prefix.magenta, 'Downloading GTFS Data')
      debugger
      const res = await axios.get(this.downloadOptions.url, {
        responseType: 'stream',
      })
      const dest = createWriteStream(this.zipLocation)
      res.data.pipe(dest)

      log(config.prefix.magenta, 'Finished Downloading GTFS Data')
    } catch (error) {
      log(error)
    }
  }

  async unzip() {
    log('Unzipping GTFS Data')
    const { zipLocation } = this
    const extractor = promisify(extract.default)

    await extractor(zipLocation, {
      dir: _resolve(`${zipLocation}unarchived`),
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
    if (!existsSync(this.zipLocation)) {
      console.warn('Shapes could not be found!')
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
      await new Promise((resolve, reject) => {
        rimraf.default(outputDir2, resolve)
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

export default SingleImporter
