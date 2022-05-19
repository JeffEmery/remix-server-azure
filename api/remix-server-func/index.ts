import './globals'
import { createRequestHandler } from './server'

export type { GetLoadContextFunction, RequestHandler } from './server'

//export { createRequestHandler } from './server'

module.exports = createRequestHandler({ build: require('../../build') })
