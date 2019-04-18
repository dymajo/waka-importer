import BaseImporter from './BaseImporter'

class OtagoImporter extends BaseImporter {
  constructor() {
    super()
    this.zipname = 'otago'
    this.url = 'https://www.orc.govt.nz/transit/google_transit.zip'
  }
}

export default OtagoImporter
