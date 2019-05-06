export interface IWakaConfig {
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
  tfnswApiKey: string
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
}
