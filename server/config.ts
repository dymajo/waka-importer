import 'dotenv/config'

interface IWakaConfig {
  prefix: string
  version: string
  mode: 'all' | 'db' | 'shapes' | 'unzip' | 'download' | 'export'
  storageService: 'aws' | 'azure'
  shapesContainer: string
  shapesRegion: string
  shapesSkip: boolean
  emulatedStorage: boolean
  local?: boolean
  keyValue?: 'dynamo'
  keyValueVersionTable?: string
  keyValueRegion?: string
  tfnswApiKey?: string
  db: {
    user: string
    password: string
    server: string
    database: string
    master_database: string
    transactionLimit: number
    connectionTimeout: number
    requestTimeout: number
  }
  [key: string]: string | undefined | boolean | number | object
}

declare const process: {
  env: {
    PREFIX: string
    MODE?: 'all' | 'db' | 'shapes' | 'unzip' | 'download' | 'export'
    VERSION: string
    KEYVALUE?: 'dynamo'
    KEYVALUE_VERSION_TABLE?: string
    KEYVALUE_REGION?: string
    DB_DATABASE: string
    DB_USER: string
    DB_PASSWORD: string
    DB_SERVER: string
    DB_MASTER_DATABASE?: string
    DB_TRANSACTION_LIMIT?: string
    DB_CONNECTION_TIMEOUT?: string
    DB_REQUEST_TIMEOUT?: string
    STORAGE_SERVICE?: 'aws' | 'azure'
    SHAPES_CONTAINER?: string
    SHAPES_REGION?: string
    SHAPES_SKIP?: string
    EMULATED_STORAGE?: string
    TFNSW_API_KEY?: string
  }
}

const {
  PREFIX,
  VERSION,
  KEYVALUE,
  KEYVALUE_VERSION_TABLE,
  KEYVALUE_REGION,
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  DB_SERVER,
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
} = process.env

const config: IWakaConfig = {
  prefix: PREFIX,
  version: VERSION,
  mode: MODE || 'all',
  storageService: STORAGE_SERVICE || 'aws',
  shapesContainer: SHAPES_CONTAINER || 'shapes-us-west-2.waka.app',
  shapesRegion: SHAPES_REGION || 'us-west-2',
  shapesSkip: SHAPES_SKIP === 'true' || false,
  emulatedStorage: EMULATED_STORAGE === 'true' || false,
  keyValue: KEYVALUE,
  keyValueVersionTable: KEYVALUE_VERSION_TABLE,
  keyValueRegion: KEYVALUE_REGION,
  tfnswApiKey: TFNSW_API_KEY,

  db: {
    user: DB_USER,
    password: DB_PASSWORD,
    server: DB_SERVER,
    database: DB_DATABASE || `${PREFIX}_${VERSION}`,
    master_database: DB_MASTER_DATABASE || 'master',
    transactionLimit: DB_TRANSACTION_LIMIT
      ? parseInt(DB_TRANSACTION_LIMIT, 10)
      : 50000,
    connectionTimeout: DB_CONNECTION_TIMEOUT
      ? parseInt(DB_CONNECTION_TIMEOUT, 10)
      : 60000,
    requestTimeout: DB_REQUEST_TIMEOUT
      ? parseInt(DB_REQUEST_TIMEOUT, 10)
      : 60000,
  },
}

export default config