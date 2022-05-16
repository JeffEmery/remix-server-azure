# Remix Run Server on Azure Functions

Start by setting up a basic Remix Run application

```consle
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

Azure Core Tools Azure Functions Extension

### Setup Azure Function within VS Code

F1 - Azure Static Web Apps - Create HTTP Function... TypeScript
azure-server-func

The following will be automatically configured in the `.vscode` folder.

#### `extension.json`

Defines the extensions used for this VS Code project

#### `launch.json`

Debugger configuration to Attach to Node Functions

#### `settings.json`

Configuration settings for Azure Functions deployment

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

# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in Remix app
server is production-ready.

Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`

### Using a Template

When you ran `npx create-remix@latest` there were a few choices for hosting. You
can run that again to create a new project, then copy over your `app/` folder to
the new project that's pre-configured for your target server.

```sh
cd ..
# create a new project, and pick a pre-configured host
npx create-remix@latest
cd my-new-remix-app
# remove the new project's app (not the old one!)
rm -rf app
# copy your app over
cp -R ../my-old-remix-app/app app
```
