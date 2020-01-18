import AWS from 'aws-sdk'
import { PutObjectRequest } from 'aws-sdk/clients/s3'
import axios from 'axios'
import FormData from 'form-data'
import { createReadStream } from 'fs'
import config from '../config'
import logger from '../logger'

const log = logger(config.prefix, config.version)
interface StorageProps {
  backing?: string
  endpoint?: string
  region?: string
}

class Storage {
  private readonly backing?: string
  private readonly s3?: AWS.S3
  public constructor(props: StorageProps) {
    this.backing = props.backing
    if (this.backing === 'aws') {
      // const credentials = new AWS.SharedIniFileCredentials({
      //   profile: 'dymajo',
      // })
      // AWS.config.credentials = credentials
      this.s3 = new AWS.S3({
        endpoint: props.endpoint,
        region: props.region,
      })
    }
  }

  public readonly uploadFile = async (
    container: string,
    file: string,
    sourcePath: string,
  ) => {
    if (this.backing === 'aws' && this.s3 !== undefined) {
      const params: PutObjectRequest = {
        Body: createReadStream(sourcePath),
        Bucket: container,
        Key: file,
      }
      await this.s3.putObject(params).promise()
    }
    if (this.backing === 'local') {
      try {
        const bodyFormData = new FormData()
        bodyFormData.append('uploadFile', createReadStream(sourcePath))
        await axios.post(`http://127.0.0.1:9004/${file}`, bodyFormData, {
          headers: bodyFormData.getHeaders(),
        })
      } catch (error) {
        log.error(error.data)
        // throw error
      }
    }
  }
}
export default Storage
