import MultiImporter from '../MultiImporter'

class CanberraImporter extends MultiImporter {
  constructor() {
    super({
      locations: [
        {
          endpoint:
            'https://www.transport.act.gov.au/googletransit/google_transit.zip',
          type: 'bus',
          name: 'cbrbuses',
        },
        {
          endpoint:
            'https://www.transport.act.gov.au/googletransit/google_transit_lr.zip',
          type: 'lightrail',
          name: 'cbrlightrail',
        },
      ],
    })
  }
}

export default CanberraImporter
