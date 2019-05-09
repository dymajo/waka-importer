import { createReadStream } from 'fs'
import config from '../config'
import log from '../logger'
const azuretestcreds = [
  'devstoreaccount1',
  'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
  'http://127.0.0.1:10000/devstoreaccount1',
]

interface IStorageProps {
  backing?: 'azure' | 'aws'
  endpoint?: string
  region?: string
  local?: boolean
}

class Storage {
  backing: string
  s3: AWS.S3
  constructor(props: IStorageProps) {
    this.backing = props.backing
    if (this.backing === 'azure') {
      throw Error('azure not supported')
      // const azure = require('azure-storage')
      // const creds = props.local ? azuretestcreds : []
      // this.blobSvc = azure.createBlobService(...creds)
    } else if (this.backing === 'aws') {
      const AWS = require('aws-sdk')
      this.s3 = new AWS.S3({
        endpoint: props.endpoint,
        region: props.region,
      })
    }
  }

  createContainer(container: string, cb: any) {
    const createCb = (error: any) => {
      if (error) {
        log(error)
        throw error
      }
      cb()
    }
    if (this.backing === 'azure') {
      // this.blobSvc.createContainerIfNotExists(container, createCb)
    } else if (this.backing === 'aws') {
      const params = {
        Bucket: container,
      }
      this.s3.createBucket(params, createCb)
    }
  }

  downloadStream(container: string, file: string, stream: any, callback: any) {
    if (this.backing === 'azure') {
      // return this.blobSvc.getBlobToStream(container, file, stream, callback)
    }
    if (this.backing === 'aws') {
      const params = {
        Bucket: container,
        Key: file,
      }
      return this.s3
        .getObject(params, callback)
        .createReadStream()
        .pipe(stream)
    }
  }

  uploadFile(
    container: string,
    file: string,
    sourcePath: string,
    callback: any
  ) {
    if (this.backing === 'azure') {
      // return this.blobSvc.createBlockBlobFromLocalFile(
      //   container,
      //   file,
      //   sourcePath,
      //   callback
      // )
    }
    if (this.backing === 'aws') {
      const params = {
        Body: createReadStream(sourcePath),
        Bucket: container,
        Key: file,
      }
      return this.s3.putObject(params, callback)
    }
  }

  // async upload(path) {
  //   const { local } = config
  //   if (local) {
  //     await this.uploadLocal(path)
  //   } else {
  //     const AWS = require('aws-sdk')
  //     this.s3 = new AWS.S3({})
  //     await this.uploadToS3(path)
  //   }
  // }
}
export default Storage
