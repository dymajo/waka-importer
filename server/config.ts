import env from 'require-env'

export interface WakaConfig {
  prefix: string
  version: string
  mode: string
  storageService: string
  shapesContainer: string
  shapesRegion: string
  shapesSkip: boolean
  emulatedStorage: boolean
  local?: boolean
  keyValue?: string
  keyValueVersionTable?: string
  keyValueRegion?: string
  tfnswApiKey?: string
  extended: boolean
  localImport?: boolean
  localFile?: string
  db: {
    user: string
    password: string
    server: string
    database: string
    masterDatabase: string
    transactionLimit: number
    connectionTimeout: number
    requestTimeout: number
  }
  [key: string]: string | boolean | number | undefined | object
}

// declare const process: {
//   env: {
//     PREFIX: string
//     MODE?:
//       | 'all'
//       | 'db'
//       | 'shapes'
//       | 'unzip'
//       | 'download'
//       | 'export'
//       | 'fullshapes'
//     VERSION: string
//     KEYVALUE?: 'dynamo'
//     KEYVALUE_VERSION_TABLE?: string
//     KEYVALUE_REGION?: string
//     DB_DATABASE: string
//     env.require(DB_USER): string
//     DB_PASSWORD: string
//     DB_SERVER: string
//     DB_MASTER_DATABASE?: string
//     DB_TRANSACTION_LIMIT?: string
//     DB_CONNECTION_TIMEOUT?: string
//     DB_REQUEST_TIMEOUT?: string
//     STORAGE_SERVICE?: 'aws' | 'local'
//     SHAPES_CONTAINER?: string
//     SHAPES_REGION?: string
//     SHAPES_SKIP?: string
//     EMULATED_STORAGE?: string
//     TFNSW_API_KEY?: string
//     EXTENDED?: string
//     LOCAL_IMPORT?: string
//     LOCAL_FILE?: string
//   }
// }

const {
  PREFIX,
  VERSION,
  KEYVALUE_VERSION_TABLE,
  KEYVALUE_REGION,
  DB_DATABASE,
  DB_MASTER_DATABASE,
  DB_TRANSACTION_LIMIT,
  DB_CONNECTION_TIMEOUT,
  DB_REQUEST_TIMEOUT,
  MODE,
  STORAGE_SERVICE,
  SHAPES_CONTAINER,
  SHAPES_REGION,
  SHAPES_SKIP,
  EMULATED_STORAGE,
  TFNSW_API_KEY,
  EXTENDED,
  LOCAL_FILE,
  LOCAL_IMPORT,
} = process.env

const config: WakaConfig = {
  prefix: env.require('PREFIX'),
  version: env.require('VERSION'),
  mode: MODE !== undefined ? MODE : 'all',
  storageService: STORAGE_SERVICE !== undefined ? STORAGE_SERVICE : 'aws',
  shapesContainer:
    SHAPES_CONTAINER !== undefined
      ? SHAPES_CONTAINER
      : 'shapes-us-west-2.waka.app',
  shapesRegion: SHAPES_REGION !== undefined ? SHAPES_REGION : 'us-west-2',
  shapesSkip: SHAPES_SKIP === 'true',
  emulatedStorage: EMULATED_STORAGE === 'true',
  keyValue: env.require('KEYVALUE'),
  keyValueVersionTable: KEYVALUE_VERSION_TABLE,
  keyValueRegion: KEYVALUE_REGION,
  tfnswApiKey: TFNSW_API_KEY,
  extended: EXTENDED === 'true',
  localFile: LOCAL_FILE !== undefined ? LOCAL_FILE : '',
  localImport: LOCAL_IMPORT === 'true',
  db: {
    user: env.require('DB_USER'),
    password: env.require('DB_PASSWORD'),
    server: env.require('DB_SERVER'),
    database: DB_DATABASE !== undefined ? DB_DATABASE : `${PREFIX}_${VERSION}`,
    masterDatabase:
      DB_MASTER_DATABASE !== undefined ? DB_MASTER_DATABASE : 'master',
    transactionLimit:
      DB_TRANSACTION_LIMIT !== undefined
        ? parseInt(DB_TRANSACTION_LIMIT, 10)
        : 50000,
    connectionTimeout:
      DB_CONNECTION_TIMEOUT !== undefined
        ? parseInt(DB_CONNECTION_TIMEOUT, 10)
        : 60000,
    requestTimeout:
      DB_REQUEST_TIMEOUT !== undefined
        ? parseInt(DB_REQUEST_TIMEOUT, 10)
        : 60000,
  },
}

export default config
