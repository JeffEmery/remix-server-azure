# Remix App Server on Azure Functions

Start by setting up a basic Remix Run application

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

## Setup the Project for Azure Functions

```console
$ npm run build
```

Verify `api/build` folder is created.

### VS Code Prerequisites

[Azure Static Web Apps extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps)

[Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cwindows%2Ccsharp%2Cportal%2Cbash#install-the-azure-functions-core-tools)

[Azure Functions extension](https://docs.microsoft.com/en-us/azure/azure-functions/functions-develop-vs-code?tabs=csharp#install-the-azure-functions-extension)

### Setup Azure Function within VS Code

Setting up the Azure Functions with the Azure Static Web tool allows you to
create a function in the `api` folder with the `.vscode` settings in the project
root. This allows us to keep the Remix boilerplate unmodified except for the
`serverBuildPath`. We will build the Remix App Server as an Azure Function
importing the server from `api/build/index.js`

> F1
>
> Azure Static Web Apps - Create HTTP Function...
>
> Select a language: TypeScript
>
> Provide a function name: [func_name]

A `[func_name]` folder will be created in the `api` folder with boilerplate
Azure Function code in TypeScript.

Default Azure Function configuration files will be created in the `api` folder.

- `.funcignore`
- `.gitignore`
- `host.json`
- `package.json`
- `tsconfig.json`

The following will be automatically configured in the project root `.vscode`
folder.

#### `extension.json`

Defines the extensions used for this VS Code project

#### `launch.json`

Debugger configuration to Attach to Node Functions

#### `settings.json`

Configuration settings for Azure Functions deployment. The important bit of this
is the `azureFunctions.deploySubpath` setting that deploys functions to a
`/api/[function-name]` URL.

#### `tasks.json`

Build configuration for Azure Functions

## Create a GitHub Repository

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

## Deploy the Sample Function to Azure

> F1
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
GitHub Action that will build and deploy the Remix App Server as an Azure
Function.

Pull the GitHub Action workflow down to your local repository and change the
package path for deployment.

#### Modify the setting in `.github/workflows/main_[func_app_name].yml`

```yaml
env:
  AZURE_FUNCTIONAPP_PACKAGE_PATH: 'api'
```

Push the updates to the repository. After the GitHub Action runs, you should
have a working Azure Function App with a boilerplate TypeScript http trigger
function that can be called from URL
https://[func_app_name].azurewebsites.net/api/[func_name]
