import BaseImporter from './BaseImporter'

class ATImporter extends BaseImporter {
  zipname: 'at'
  url: 'https://atcdn.blob.core.windows.net/data/gtfs.zip'
}
// auckland.files = auckland.files.map(file => {
//   if (file.name !== 'agency.txt') {
//     file.versioned = true
//   }
//   return file
// })

export default ATImporter
