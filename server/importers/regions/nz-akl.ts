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

    await sqlRequest.query(`
      UPDATE trips
      SET trip_headsign = RIGHT(trip_headsign, LEN(trip_headsign) - PATINDEX('% To %', trip_headsign) - 3)
      WHERE trip_headsign like '%To%';
    `)
    log.info('Post Import: Updated trip headsigns to the headsigns only')

    await sqlRequest.query(`
      UPDATE stop_times
      SET stop_times.stop_id = stops.parent_station
      FROM stop_times INNER JOIN stops on stop_times.stop_id = stops.stop_id
      WHERE stop_name like '%Train Station%' and location_type = 0 and parent_station IS NOT null;
      UPDATE stops SET location_type = 3 WHERE stop_name like '%Train Station%' and location_type = 0 and parent_station IS NOT null;
      UPDATE stops SET location_type = 0 WHERE stop_name like '%Train Station%' and location_type = 1;
    `)
    log.info('Post Import: Updated train stations to remove platforms')
  }
}

export default AucklandImporter
