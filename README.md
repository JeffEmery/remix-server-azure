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

Change the serverBuildPath for Remix

#### remix.config.js

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
root. This allows us to keep the Remix boilerplate unmodified. We will build the
Remix App Server as an Azure Function importing the server from
`api/build/index.js`

> F1
>
> Azure Static Web Apps - Create HTTP Function...
>
> Select a language: TypeScript
>
> Provide a function name: remix-server-func

A `remix-server-func` folder will be created in the `api` folder with
boilerplate Azure Function code in TypeScript.

Default Azure Function configuration files will be created in the `api` folder.

- `.funcignore`
- `.gitignore`
- `host.json`
- `package.json`
- `tsconfig.json`

The following will be automatically configured in the `.vscode` folder.

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

### Ingore the `build` folders

#### `.gitignore`

```js
node_modules

/.cache
build
.env
```

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

Create the Azure Function App F1 Azure Functions: Create Function App in
Azure...(Advanced)

Now you should have the sample Azure Function responding to an HTTP GET.

### Setup automatic build and deployment (CI/CD)

From Azure Portal, go to the Azure Function App and select the Deployment

Create a deployment GitHub Action
