import 'dotenv/config'
import 'source-map-support/register'
import connection from './db/connection'
import CreateDb from './db/create'
import logger from './logger'
import Importer from './importers'
import config from './config'

const log = logger(config.prefix, config.version)

log.info('Importer Started')

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

const checkCreated = async (): Promise<boolean> => {
  const sqlRequest = connection.get().request()
  const databaseCreated = await sqlRequest.query<{ dbcreated: number }>(
    `
    select OBJECT_ID('agency', 'U') as 'dbcreated'
    `,
  )
  return !(databaseCreated.recordset[0].dbcreated === null)
}

const start = async (): Promise<never> => {
    await connection.open()

    log.info('Connected to Database')
    const created = await checkCreated()
    if (!created) {
      log.info('Building Database from Template')
      const creator = new CreateDb()
      await creator.start()
    }

    log.info('Worker Ready')
    const importer = new Importer({
      keyvalue: config.keyValue,
      keyvalueVersionTable: config.keyValueVersionTable,
      keyvalueRegion: config.keyValueRegion,
    })
    const { mode } = config
    switch (mode) {
      case 'all':
        log.info('Started import of ALL')
        await importer.start(created)
        break
      case 'db':
        log.info('Started import of DB')
        await importer.db()
        break
      case 'shapes':
        log.info('Started import of SHAPES')
        await importer.shapes()
        break
      case 'unzip':
        log.info('Started UNZIP')
        await importer.unzip()
        break
      case 'download':
        log.info('Started DOWNLOAD')
        await importer.download()
        break
      case 'export':
        log.info('Started EXPORT')
        await importer.exportDb()
        break
      case 'fullshapes':
        log.info('Started FULL SHAPES')
        await importer.fullShapes()
        break
      default:
        break
    }
    log.info(`Completed ${mode.toUpperCase()}`)
    process.exit(0)
  }

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
;(async () => {
  try {
    await start()
  } catch (error) {
    log.error(error)
  }
})()
