import BaseImporter from '../BaseImporter'

class SEQImporter extends BaseImporter {
  constructor() {
    super({
      url: 'https://gtfsrt.api.translink.com.au/GTFS/SEQ_GTFS.zip',
      zipname: 'seq_gtfs',
    })
  }
}

export default SEQImporter
