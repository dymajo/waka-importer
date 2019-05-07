import BaseImporter from '../BaseImporter'

class PTVImporter extends BaseImporter {
  constructor() {
    super({
      url: 'http://data.ptv.vic.gov.au/downloads/gtfs.zip',
      zipname: 'melbourne',
    })
  }
}

export default PTVImporter
