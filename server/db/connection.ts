import { ConnectionPool } from 'mssql'
import config from '../config'
import logger from '../logger'

const log = logger(config.prefix, config.version)
const connectMaster = async () => {
  const masterConfig = {
    ...config.db,
    database: config.db.masterDatabase,
  }
  const { database } = config.db
  try {
    const pool = new ConnectionPool(masterConfig)
    await pool.connect()
    // prepared statements were not working.
    // also, you set this yourself, so your own fault if you drop all your tables
    await pool
      .request()
      .query(`If(db_id(N'${database}') IS NULL) CREATE DATABASE "${database}"`)
  } catch (err) {
    log.error(
      'master',
      'Failed to connect to master database! Check the db.database',
    )
    log.error(err)
    process.exit(1)
  }
  return true
}

let cresolve: (value?: {} | PromiseLike<{}>) => void
let creject: (reason?: any) => void
let pool1: ConnectionPool
const ready = new Promise((resolve, reject) => {
  cresolve = resolve
  creject = reject
})
const connection = {
  get: () => pool1,
  open: () => {
    connectMaster()
      .then(() => {
        pool1 = new ConnectionPool(config.db, (err) => {
          if (err) {
            log.error(err)
            return creject()
          }
          return cresolve()
        })
        return pool1
      })
      .catch((err) => {
        throw err
      })
    return ready
  },
  isReady: ready,
}
export default connection
