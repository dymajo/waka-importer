import BaseImporter from '../BaseImporter'

class ChchImporter extends BaseImporter {
  constructor() {
    super({
      zipname: 'metro-christchurch',
      url: 'http://metroinfo.co.nz/Documents/gtfs.zip',
    })
  }
}

export default ChchImporter
