# Remix App Server on Azure Functions

Create a separate Azure Function App to run the Remix App Server. The Remix App
Server will then handle responses to a Remix application deployed to Azure
Static Web Apps by connecting the SWA to an existing AFA. This separates the
Azure Function 'Remix Adapter' from the developers.
[See API support in Azure Static Web Apps with Azure Functions](https://docs.microsoft.com/en-us/azure/static-web-apps/apis)
and
[Bring your own functions to Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/functions-bring-your-own)

Making a Static Web App work with the Azure Function server together is
possible, but the debugging experience was flaky and cumbersome. Separating the
projects and debuggers should help developers concentrate on Remix code and not
the server side implementation.

## Setup the Remix Run application

```console
$ npx create-remix@latest
? Where would you like to create your app? remix-server-azure
? What type of app do you want to create? Just the basics
? Where do you want to deploy? Choose Remix if you're unsure; it's easy to change deployment targets. Remix App Server
? Do you want me to run `npm install`? Yes
? TypeScript or JavaScript? TypeScript
💿 That's it! `cd` into "C:\code\learn\remix-server-azure" and check the README for development and deploy instructions!

$ cd remix-server-azure/

$ code .
```

#### Change the serverBuildPath for Remix `remix.config.js`

```js
/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  ignoredRouteFiles: ['**/.*'],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  serverBuildPath: 'api/build/index.js',
  // publicPath: "/build/",
}
```

#### Modify `.gitignore` to ignore the `api/build' folder.

```js
node_modules

/.cache
/api/build
/public/build
.env
```

#### Verify `api/build` folder is created.

```console
$ npm run build
```

## Setup the Azure Functions

It is more simple to setup the project for Azure Functions using the VS Code
extensions for Azure.

### VS Code Extensions

[Azure Static Web Apps extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps)

[Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cwindows%2Ccsharp%2Cportal%2Cbash#install-the-azure-functions-core-tools)

[Azure Functions extension](https://docs.microsoft.com/en-us/azure/azure-functions/functions-develop-vs-code?tabs=csharp#install-the-azure-functions-extension)

### Setup Azure Function within VS Code

Setting up the Azure Functions with the Azure Static Web tool allows you to
create a function in the `api` folder with the `.vscode` settings in the project
root. This allows us to keep the Remix boilerplate unmodified except for the
`serverBuildPath`. The Remix App Server build will be imported into to the Azure
Function from `api/build/index.js`

> VS Code - F1
>
> Azure Static Web Apps - Create HTTP Function...
>
> Select a language: TypeScript
>
> Provide a function name: [func_name]

A `[func_name]` folder will be created under the `api` folder with boilerplate
Azure Function TypeScript code. Change the
[name of the `out` binding](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-return-value?tabs=javascript)
to `$return` since we are using TypeScript.

#### `function.json`

```json
{
  "bindings": [
    { ... },
    {
      "type": "http",
      "direction": "out",
      "name": "$return"
    }
  ],
  "scriptFile": "../dist/[func_name]/index.js"
}
```

Default Azure Function configuration files will be created in the `api` folder.

- `.funcignore`
- `.gitignore`
- `host.json`
- `package.json`
- `tsconfig.json`

The following will be automatically configured in the project root `.vscode`
folder.

- **`extension.json`** Defines the extensions used for this VS Code project

- **`launch.json`** Debugger configuration to Attach to Node Functions

- **`settings.json`** Configuration settings for Azure Functions deployment

  > Sets `azureFunctions.deploySubpath` to `api` so functions are located at
  > `/api/[func-name]`

- **`tasks.json`** Build configuration for Azure Functions

## Create a GitHub Repository

[GitHub command line](https://github.com/cli/cli) tools make it easier to setup
a repository from the terminal.

```console
$ gh repo create
? What would you like to do? Push an existing local repository to GitHub
? Path to local repository (.)

? Path to local repository .
? Repository name remix-server-azure
? Description
? Visibility Public
✓ Created repository JeffEmery/remix-server-azure on GitHub
? Add a remote? Yes
? What should the new remote be called? (origin)
? What should the new remote be called? origin
✓ Added remote https://github.com/JeffEmery/remix-server-azure.git
```

```console
$ git add .
$ git commit -m 'init remix server azure func'
$ git push -u origin main
```

### Deploy the Sample Function to Azure

> VS Code - F1
>
> Azure Functions: Create Function App in Azure...(Advanced)
>
> Select Subscription: [your subscription]
>
> Enter a globally unique name: [your remix server func app]
>
> Select a runtime stack: Node.js 16 LTS
>
> Select an OS: Linux
>
> ...complete the rest according to your environment...

### Setup CI/CD from Azure Portal

Go to the newly create Azure Function App in the Azure Portal. Open the Settings
tab in the Deployment Center pane and connect to the GitHub repository.

Save the configuration to create a `.github/workflows/main_[func_app_name].yml`
file for a
[Function App GitHub Action](https://github.com/Azure/actions-workflow-samples/tree/master/FunctionApp)
that will build and deploy the Remix App Server as an Azure Function. (pull the
repo local)

#### Modify the setting in `.github/workflows/main_[func_app_name].yml`

Change the package path for deployment to `api`. The function runtime package
will be built and deployed from this location. The root Remix code will not be
deployed.

```yaml
env:
  AZURE_FUNCTIONAPP_PACKAGE_PATH: 'api'
```

#### Test the deployment

Push the updates. After the GitHub Action runs, you should have a working Azure
Function App with a boilerplate TypeScript http trigger function that can be
called from URL [https://[func_app_name].azurewebsites.net/api/[func_name]]()

```console
$ curl 'https://[func_app_name].azurewebsites.net/api/[func_name]'
This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.
```

#### Add API Key authorization

Secure the Azure Function with
[Function Key authorization](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=in-process%2Cfunctionsv2&pivots=programming-language-javascript#http-auth).
[Pass a `?code=[api_key]` query string or an `x-functions-key` request header](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=in-process%2Cfunctionsv2&pivots=programming-language-javascript#api-key-authorization)
to authorize the call.

Verify the call still returns a 404 response.

```console
$ curl 'https://[func_app_name]azurewebsites.net/api/[func_name]?code=4r6U43...'
This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.
```

## Create the Remix App Server as an Azure Function

To get the Azure Function setup as the Remix App Server, we have to compile the
Remix Server build and import that into the Azure Function. The implementation
is similar to other
[Remix Adapters](https://remix.run/docs/en/v1/other-api/adapter).

> TODO: See if there's community interest for creating a supported Azure
> Function adapter in Remix

#### Prepare the Azure Function to run the Remix App Server

Replace the Azure Function boilerplate code with the
[Remix Server request handler]([api/remix-azure/index.ts)).

#### Add a build step for the Remix App Server

The Remix App Server code is built into the folder designated by
`serverBuildPath` in `remix.config.js`. It is imported into the handler
function.

```yaml
# Runs the core remix run build with a `api/build/index.js' serverBuildPath. The
# resulting index.js is then `require` in the Azure Function.
- name: 'Build Remix App Server'
  shell: bash
  run: |
    npm install
    npm run build --if-present
    npm run test --if-present

  # Change into the `api` folder and run the Azure Function build which compiles the
  # TypeScript with the `tsc` command.
- name: 'Build Azure Function'
  shell: bash
  run: |
    pushd './${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}'
    npm install
    npm run build --if-present
    npm run test --if-present
    popd
```

Adding the _Build Remix App Server_ step into the GitHub Action compiles the
server code into the `../../build` folder. In the following _Build Azure
Function_ step the code is _`require'd`_ in
`module.exports = createRequestHandler({ build: require('../../build') })`

You should now have a functioning Remix Request Handler implemented as a Azure
Function App with a [func_name] Azure Function. The call should return a
Remix 404.

```console
$ curl 'https://[func_app_name].azurewebsites.net/api/[func_name]?code=46df...'
<!DOCTYPE html>...
```

## **_- Fin -_**
