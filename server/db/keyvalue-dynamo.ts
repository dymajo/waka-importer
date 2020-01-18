import { DynamoDB } from 'aws-sdk'
import logger from '../logger'
import config from '../config'
import { SafeAny } from '../types'

const log = logger(config.prefix, config.version)
interface KeyvalueDynamoProps {
  name: string
  region: string
}

class KeyvalueDynamo {
  private readonly name: string
  private readonly dynamo: DynamoDB
  public constructor(props: KeyvalueDynamoProps) {
    const { name, region } = props
    this.name = name
    this.dynamo = new DynamoDB({ region })
  }

  private readonly flattenObject = (obj: SafeAny) => {
    const { flattenObject } = this
    const response: SafeAny = {}
    Object.keys(obj)
      .filter(key => key !== 'id')
      .forEach(key => {
        if (obj[key].M != null) {
          response[key] = flattenObject(obj[key].M)
        } else {
          response[key] = !isNaN(parseFloat(obj[key].N))
            ? parseFloat(obj[key].N)
            : obj[key].S
        }
      })
    return response
  }

  private readonly fattenObject = (obj: { [key: string]: SafeAny }) => {
    const { fattenObject } = this
    // type Response = {
    //   [key: string]: Response | DynamoDB.AttributeValue | DynamoDB.AttributeMap
    // }
    // const response: Response = {}
    const response: SafeAny = {}

    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'number') {
        response[key] = { N: obj[key].toString() }
      } else if (typeof obj[key] === 'string') {
        response[key] = { S: obj[key] }
      } else if (typeof obj[key] === 'object') {
        response[key] = { M: fattenObject(obj[key]) }
      }
    })
    return response
  }

  public get = async (key: string) => {
    const { name, dynamo, flattenObject } = this
    const params = {
      Key: {
        id: {
          S: key,
        },
      },
      TableName: name,
    }
    try {
      const data = await dynamo.getItem(params).promise()
      const response = data.Item ?? {}
      return flattenObject(response)
    } catch (err) {
      log.error({ err }, 'Could not get DynamoDB Item')
      return {}
    }
  }

  public set = async (key: string, value: SafeAny) => {
    const { name, dynamo, fattenObject } = this
    const item = fattenObject(value)
    item.id = { S: key }
    const params = {
      Item: item,
      TableName: name,
    }
    return new Promise(resolve => {
      dynamo.putItem(params, err => {
        if (err != null) {
          log.error({ err }, 'Could not set DynamoDB Item')
          return resolve(false)
        }
        return resolve(true)
      })
    })
  }

  public delete = async (key: string) => {
    const { name, dynamo } = this
    const params = {
      Key: {
        id: {
          S: key,
        },
      },
      TableName: name,
    }
    return new Promise(resolve => {
      dynamo.deleteItem(params, err => {
        if (err != null) {
          log.error({ err }, 'Could not delete DynamoDB Item')
          return resolve(false)
        }
        return resolve(true)
      })
    })
  }

  public scan = async () => {
    const { name, dynamo } = this
    const params = {
      TableName: name,
    }
    return new Promise(resolve => {
      dynamo.scan(params, (err, data) => {
        if (err != null) {
          log.error({ err }, 'Could not scan DynamoDB Table')
          return resolve({})
        }
        const response: SafeAny = {}
        if (data?.Items) {
          data.Items.forEach(i => {
            if (i.id?.S != null) {
              response[i.id.S] = this.flattenObject(i)
            }
          })
        }
        return resolve(response)
      })
    })
  }
}
export default KeyvalueDynamo
