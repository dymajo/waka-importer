import BaseImporter from './BaseImporter'

class ChchImporter extends BaseImporter {
  constructor() {
    super()
    this.zipname = 'metro-christchurch'
    this.url = 'http://metroinfo.co.nz/Documents/gtfs.zip'
  }
}

export default ChchImporter
