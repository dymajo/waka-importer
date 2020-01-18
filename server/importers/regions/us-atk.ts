import SingleImporter from '../SingleImporter'

class AmtrakImporter extends SingleImporter {
  public constructor() {
    super({
      url:
        'http://github.com/transitland/gtfs-archives-not-hosted-elsewhere/raw/master/amtrak.zip',
      zipname: 'amtrak',
    })
  }
}

export default AmtrakImporter
