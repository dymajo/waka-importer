import BaseImporter from './BaseImporter'

class ATImporter extends BaseImporter {
  constructor() {
    super()
    this.zipname = 'at'
    this.url = 'https://atcdn.blob.core.windows.net/data/gtfs.zip'
    this.files = this.files.map(file => {
      if (file.name !== 'agency.txt') {
        file.versioned = true
      }
      return file
    })
  }
}

export default ATImporter
