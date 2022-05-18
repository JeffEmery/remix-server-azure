/*
References:
https://github.com/remix-run/remix/blob/main/packages/remix-architect/server.ts
https://github.com/remix-run/remix/blob/main/packages/remix-netlify/server.ts
https://github.com/remix-run/remix/blob/main/packages/remix-express/server.ts
https://github.com/remix-run/remix/blob/main/packages/remix-vercel/server.ts
https://github.com/remix-run/remix/blob/main/packages/remix-cloudflare-workers/worker.ts
https://github.com/remix-run/remix/blob/main/packages/remix-cloudflare-pages/worker.ts
https://github.com/mcansh/remix-on-azure/blob/main/azure/function/handler.js
*/

import {
  AbortController,
  Headers as NodeHeaders,
  Request as NodeRequest,
  createRequestHandler as createRemixRequestHandler,
} from '@remix-run/node'

import type {
  AzureFunction,
  Context as AzureContext,
  Cookie as AzureCookie,
  HttpRequest as AzureHttpRequest,
  HttpRequestHeaders as AzureHttpRequestHeaders,
} from '@azure/functions'

import type {
  AppLoadContext,
  RequestInfo as NodeRequestInfo,
  RequestInit as NodeRequestInit,
  Response as NodeResponse,
  ServerBuild,
} from '@remix-run/node'
import { isErrorResponse } from '@remix-run/react/data'

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
  //cookies?: Array<AzureCookie>
  body: string
}

export type RequestHandler = (
  context: AzureContext,
  req: AzureHttpRequest
) => Promise<AzureHttpResponse>

/**
 * Returns a request handler for Azure Functions that serves the response using Remix.
 */
export function createRequestHandler({
  build,
  getLoadContext,
  mode = process.env.NODE_ENV,
}: {
  build: ServerBuild
  getLoadContext?: GetLoadContextFunction
  mode?: string
}): RequestHandler {
  let handleRequest = createRemixRequestHandler(build, mode)

  return async (context, req) => {
    let abortController = new AbortController()
    let request = createRemixRequest(req, abortController)
    let loadContext =
      typeof getLoadContext === 'function'
        ? getLoadContext(context, req)
        : undefined

    let response = (await handleRequest(
      request as unknown as Request,
      loadContext
    )) as unknown as NodeResponse

    return sendRemixResponse(response, abortController)
  }
}

function createRemixRequest(
  req: AzureHttpRequest,
  abortController?: AbortController
): NodeRequest {
  // TODO: debug req object to create a `new URL(url, host)` instead of NodeRequestInfo
  //let host = req.headers["x-forwarded-host"] || req.headers.host;
  //let url = new URL(req.url, host)
  let url: NodeRequestInfo = req.headers['x-ms-original-url'] || req.url

  let init: NodeRequestInit = {
    method: req.method,
    headers: createRemixHeaders(req.headers),
    abortController,
    signal: abortController?.signal,
  }

  if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body
  }

  // return new NodeRequest(url.href, init)
  return new NodeRequest(url, init)
}

// Create node headers from the Azure Function Request Headers
export function createRemixHeaders(
  requestHeaders: AzureHttpRequestHeaders
): NodeHeaders {
  let headers = new NodeHeaders()

  // TODO: verify multiple cookies is correclty mapped
  for (let [key, value] of Object.entries(requestHeaders)) {
    if (value) {
      headers.append(key, value)
    }
  }

  return headers
}

export async function sendRemixResponse(
  nodeResponse: NodeResponse,
  abortController: AbortController
): Promise<AzureHttpResponse> {
  if (abortController.signal.aborted) {
    nodeResponse.headers.set('Connection', 'close')
  }

  return {
    status: nodeResponse.status,
    headers: nodeResponse.headers.raw(),
    // cookies: [
    //   { name: 'env-user', value: 'john-doe' },
    //   { name: 'env-role', value: 'generic' },
    // ],
    //body: response.body as unknown as ReadableStream,
    body: await nodeResponse.text(),
  }
}

// const httpTrigger: AzureFunction = async function (
//   context: AzureContext,
//   req: AzureHttpRequest
// ): Promise<AzureHttpResponse> {
//   context.log('Here we are in the code')

//   // back to the wwwroot folder, consider TypeScript is compiled into ../dist/[name]/function.js
//   //let foo = createRequestHandler({ build: require('../../build') })
//   let build: ServerBuild = require('../../build')
//   let getLoadContext: AppLoadContext = undefined // TODO: where to set this?
//   let mode: string = process.env.NODE_ENV

//   let handleRequest: RequestHandler = createRemixRequestHandler(build, mode)

//   // TODOD: Need to get response headers from entry.server.tsx into the response

//   // the request that will be handled by node
//   let abortController = new AbortController()
//   let request = createRemixRequest(req, abortController)

//   let loadContext =
//     typeof getLoadContext === 'function' ? getLoadContext(req) : undefined

//   //let response = await handleRequest(request, loadContext)
//   let response = (await handleRequest(
//     request as unknown as Request,
//     loadContext
//   )) as unknown as NodeResponse

//   return sendRemixResponse(response, abortController)
// }

// export default httpTrigger
