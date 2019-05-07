export interface IWakaConfig {
  prefix:
    | 'au-syd'
    | 'au-cbr'
    | 'au-seq'
    | 'ch-sfr'
    | 'nz-akl'
    | 'nz-chc'
    | 'nz-otg'
    | 'nz-wlg'
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
