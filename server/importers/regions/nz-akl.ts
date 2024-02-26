import config from '../../config'
import connection from '../../db/connection'
import logger from '../../logger'
import SingleImporter from '../SingleImporter'

const log = logger(config.prefix, config.version)

class AucklandImporter extends SingleImporter {
  constructor() {
    super({
      zipname: 'at',
      url: 'https://gtfs.at.govt.nz/gtfs.zip',
    })
  }

  postImport = async () => {
    const sqlRequest = connection.get().request()
    await sqlRequest.query(`
      UPDATE routes
      SET routes.route_long_name = trips.trip_headsign
      FROM routes INNER JOIN trips on routes.route_id = trips.route_id
      WHERE routes.route_short_name = routes.route_long_name;
    `)
    log.info('Post Import: Updated route long names to trip headsign')
  }
}

export default AucklandImporter
