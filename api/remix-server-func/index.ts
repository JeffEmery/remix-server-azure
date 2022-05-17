import {
  AbortController,
  installGlobals,
  Headers as NodeHeaders,
  Request as NodeRequest,
} from '@remix-run/node'

import { createRequestHandler as createRemixRequestHandler } from '@remix-run/server-runtime'

import type {
  AzureFunction,
  Context as AzureContext,
  Cookie as AzureCookie,
  HttpRequest as AzureHttpRequest,
  HttpRequestHeaders as AzureHttpRequestHeaders,
} from '@azure/functions'

import type {
  AppLoadContext,
  RequestHandler,
  RequestInfo,
  RequestInit,
  Response as NodeResponse,
  ServerBuild,
} from '@remix-run/node'

installGlobals()

/**
 * A function that returns the value to use as `context` in route `loader` and
 * `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass
 * environment/platform-specific values through to your loader/action.
 */
export type GetLoadContextFunction = (
  context: AzureContext,
  req: AzureHttpRequest
) => AppLoadContext

interface HttpResponseHeaders {
  [name: string]: string[]
}

export type AzureHttpResponse = {
  status: number
  headers: HttpResponseHeaders
  cookies?: Array<AzureCookie>
  body: string
}

const httpTrigger: AzureFunction = async function (
  context: AzureContext,
  req: AzureHttpRequest
): Promise<AzureHttpResponse> {
  context.log('Here we are in the code')

  // back to the wwwroot folder, consider TypeScript is compiled into ../dist/[name]/function.js
  //let foo = createRequestHandler({ build: require('../../build') })
  let build: ServerBuild = require('../../build')
  let getLoadContext: AppLoadContext = undefined // TODO: where to set this?
  let mode: string = process.env.NODE_ENV

  let handleRequest: RequestHandler = createRemixRequestHandler(build, mode)

  // TODOD: Need to get response headers from entry.server.tsx into the response

  // the request that will be handled by node
  let abortController = new AbortController()
  let request = createRemixRequest(req, abortController)

  let loadContext =
    typeof getLoadContext === 'function' ? getLoadContext(req) : undefined

  //let response = await handleRequest(request, loadContext)
  let response = (await handleRequest(
    request as unknown as Request,
    loadContext
  )) as unknown as NodeResponse

  return sendRemixResponse(response, abortController)
}

export default httpTrigger

// Create the remix request from the Azure Function HttpRequest
function createRemixRequest(
  req: AzureHttpRequest,
  abortController: AbortController
): NodeRequest {
  let url: RequestInfo = req.headers['x-ms-original-url'] || req.url

  let init: RequestInit = {
    method: req.method || 'GET',
    headers: createRemixHeaders(req.headers),
    abortController,
    signal: abortController?.signal,
  }

  if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body
  }

  return new NodeRequest(url, init)
}

// Create node headers from the Azure Function Request Headers
function createRemixHeaders(
  requestHeaders: AzureHttpRequestHeaders
): NodeHeaders {
  let headers: NodeHeaders = new NodeHeaders()

  for (let [key, value] of Object.entries(requestHeaders)) {
    if (!value) continue
    headers.set(key, value)
  }

  return headers
}

async function sendRemixResponse(
  response: NodeResponse,
  abortController: AbortController
): Promise<AzureHttpResponse> {
  return {
    status: response.status,
    headers: response.headers.raw(),
    cookies: [
      { name: 'env-user', value: 'john-doe' },
      { name: 'env-role', value: 'generic' },
    ],
    //body: response.body as unknown as ReadableStream,
    body: await response.text(),
  }
}
