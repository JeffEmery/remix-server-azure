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
  RequestInit as NodeRequestInit,
  Response as NodeResponse,
  ServerBuild,
} from '@remix-run/node'

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

export type RequestHandler = (
  context: AzureContext,
  req: AzureHttpRequest
) => void | Promise<AzureHttpResponse>

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

  let azureFunc: AzureFunction = async (context, req) => {
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

  return azureFunc
}

function createRemixRequest(
  req: AzureHttpRequest,
  abortController?: AbortController
): NodeRequest {
  let url = new URL(req.headers['x-ms-original-url'] || req.url)

  let init: NodeRequestInit = {
    method: req.method,
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
export function createRemixHeaders(
  requestHeaders: AzureHttpRequestHeaders
): NodeHeaders {
  let headers = new NodeHeaders()

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
    cookies: undefined,
    body: await nodeResponse.text(),
  }
}
