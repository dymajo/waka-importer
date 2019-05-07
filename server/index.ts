import 'dotenv'
import connection from './db/connection'
import CreateDb from './db/create'
import log from './logger'
import Importer from './importers'
import TfNSWImporter from './importers/regions/au-syd'
import config from './config'

log('Importer Started')

const sydney = config.prefix === 'au-syd'
Object.keys(config).forEach(key => {
  if (config.tfnswApiKey === undefined && sydney) {
    throw new Error('no api key for sydney')
  }
  if (
    config[key] === undefined &&
    key !== 'keyValue' &&
    key !== 'keyValueVersionTable' &&
    key !== 'keyValueRegion' &&
    key !== 'tfnswApiKey'
  ) {
    throw new Error(`Variable ${key} was undefined.`)
  }
  return true
})

log('prefix: '.magenta, config.prefix)
log('version:'.magenta, config.version)

const start = async () => {
  await connection.open()

  log('Connected to Database')
  const sqlRequest = connection.get().request()
  const databaseCreated = await sqlRequest.query(
    `
      select OBJECT_ID('agency', 'U') as 'dbcreated'
    `
  )
  const created = !(databaseCreated.recordset[0].dbcreated === null)
  if (!created) {
    log('Building Database from Template')
    const creator = new CreateDb()
    await creator.start()
  }

  log('Worker Ready')
  const importer = new Importer({
    keyvalue: config.keyValue,
    keyvalueVersionTable: config.keyValueVersionTable,
    keyvalueRegion: config.keyValueRegion,
  })
  const { mode } = config
  console.log(mode)
  if (mode === 'all') {
    log('Started import of ALL')
    await importer.start(created)
  } else if (mode === 'db') {
    log('Started import of DB')
    await importer.db()
  } else if (mode === 'shapes') {
    log('Started import of SHAPES')
    await importer.shapes()
  } else if (mode === 'unzip') {
    log('Started UNZIP')
    await importer.unzip()
  } else if (mode === 'download') {
    log('Started DOWNLOAD')
    await importer.download()
  } else if (mode === 'export') {
    log('Started EXPORT')
    await importer.exportDb()
  }
  log(`Completed ${mode.toUpperCase()}`)
  process.exit(0)
}
start()
