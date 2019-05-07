import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import sql from 'mssql'

import log from '../logger.js'
import GtfsImport from '../db/gtfs-import.js'
import connection from '../db/connection.js'
import Storage from '../db/storage.js'
import KeyvalueDynamo from '../db/keyvalue-dynamo.js'
import config from '../config'

import ATImporter from './regions/nz-akl'
import ChchImporter from './regions/nz-chc'
import OtagoImporter from './regions/nz-otg'
import TCImporter from './regions/au-cbr'
import TfNSWImporter from './regions/au-syd'
import MetlinkImporter from './regions/nz-wlg'
import PTVImporter from './regions/au-mel'
import RATPImporter from './regions/fr-par'
import SEQImporter from './regions/au-seq'
import SBBCFFFFSImporter from './regions/ch-sfr'
import BaseImporter from './BaseImporter.js'
import MultiImporter from './MultiImporter.js'

const regions = {
  'nz-akl': ATImporter,
  'nz-chc': ChchImporter,
  'nz-otg': OtagoImporter,
  'nz-wlg': MetlinkImporter,
  'au-seq': SEQImporter,
  'au-mel': PTVImporter,
  'fr-par': RATPImporter,
  'ch-sfr': SBBCFFFFSImporter,
  'au-syd': TfNSWImporter,
  'au-cbr': TCImporter,
}

interface IImporterProps {
  keyvalue?: 'dynamo'
  keyvalueVersionTable?: string
  keyvalueRegion?: string
}

class Importer {
  importer: GtfsImport
  storage: Storage
  versions?: KeyvalueDynamo
  current: BaseImporter | MultiImporter
  constructor(props: IImporterProps) {
    const { keyvalue, keyvalueVersionTable, keyvalueRegion } = props
    this.importer = new GtfsImport()
    this.storage = new Storage({})

    this.versions = null
    if (keyvalue === 'dynamo') {
      this.versions = new KeyvalueDynamo({
        name: keyvalueVersionTable,
        region: keyvalueRegion,
      })
    }

    this.current = null
    try {
      const Region = regions[config.prefix]
      this.current = new Region()
    } catch (err) {
      log(
        'fatal error'.red,
        'Could not find an importer in ',
        path.join(__dirname, './regions', `${config.prefix}.js`)
      )
    }
  }

  async start(created = false) {
    if (!this.current) {
      return
    }

    const { versions } = this
    const versionId = config.db.database
    if (versions) {
      const version = await versions.get(versionId)
      let newStatus
      if (version.status === 'pendingimport') {
        newStatus = 'importing'
      } else if (version.status === 'pendingimport-willmap') {
        newStatus = 'importing-willmap'
      } else {
        log(versionId, 'Status is not pending! Cancelling import!')
        return
      }
      version.status = newStatus
      await versions.set(versionId, version)
      log(versionId, 'Updated status to', newStatus)
    }

    // if the db is already there, avoid the first few steps
    if (!created) {
      await this.download()
      await this.unzip()
      await this.db()
    } else {
      console.warn('DB already created - skipping download & unzip.')
    }
    await this.shapes()
    await this.fixStopCodes()
    await this.fixRoutes()
    await this.postImport()
    // await this.exportDb()

    if (versions) {
      const version = await versions.get(versionId)
      let newStatus
      if (version.status === 'importing') {
        newStatus = 'imported'
      } else if (version.status === 'importing-willmap') {
        newStatus = 'imported-willmap'
      } else {
        return
      }
      version.status = newStatus
      await versions.set(versionId, version)
      log(versionId, 'Updated status to', newStatus)
    }
  }

  async unzip() {
    await this.current.unzip()
  }

  async download() {
    await this.current.download()
  }

  async db() {
    await this.current.db(this.importer)
  }

  async shapes() {
    this.current.shapes()
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

  async postImport() {
    if (this.current.postImport) {
      await this.current.postImport()
    }
  }

  async exportDb() {
    const sqlRequest = connection.get().request()
    const {
      db: { database },
    } = config
    sqlRequest.input('dbName', sql.VarChar, database)
    try {
      await sqlRequest.query(
        `
        USE master;
        ALTER DATABASE ${database} SET RECOVERY SIMPLE;
        BACKUP DATABASE ${database} TO  DISK =
        N'/var/opt/mssql/backup/backup.bak'
        WITH NOFORMAT, NOINIT, NAME = ${database},
        SKIP, NOREWIND, NOUNLOAD, STATS = 10
        `
      )
    } catch (err) {
      console.log(err)
    }
  }
}
export default Importer
