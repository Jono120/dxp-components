# Running Squiz DXP Locally
Running Squiz locally is helpful to preview and create a component to test its functionality before deploying it to a Live Squiz website.

There are multiple things that can be used to create custom components or workflows for the Squiz platform.

## Install DXP CLI
Open a terminal in VS Code or preferred IDE.

For installing the DXP command line interface (CLI), the following command will install it globally on your machine:

`npm i -g @squiz/dxp-cli-next`

## Confirm DXP CLI Install
In the Terminal, run the following command to confirm the installation was successful:

`dxp-next -h`

The below should appear in the terminal:

```
Usage: dxp-next [options] [command]

dxp-next commands

Options:
  -V, --version  output the version number
  -h, --help     display help for command

Commands:
  auth           Authenticate into the DXP-Next CLI
  cmp            Component Service Commands
  job-runner     Job Runner Service Commands
  datastore      Datastore Service Commands
  cdp            Customer Data Platform Service Commands
```

## Create a Component
To see what options are available for the component services, and to check that the component services are installed within the environment.

`dxp-next cmp -h`

The below should appear in the terminal:

```
$ dxp-next cmp -h
Usage: dxp-next cmp [options] [command]

Component Service Commands

Options:
  -h, --help                 display help for command

Commands:
  deploy [options] <source>
  dev [options] <source>     A local component runner for developing new components
  dev-ui [options] <source>  A local component UI for developing new components
  init [options] <path>      Create a new component from a template
  help [command]             display help for command
```

## Creating the component
Creating a new component for the platform can be done through running the CLI commands.

`dxp-next cmp init <path>` 

It will create a new component in the specific file path.

### File Structure Creation
Once the component is ready, create the following folder structure and files within the component directory:
```
mkdir <components-folder>
cd <components-folder>
mkdir <component-directory>
cd <component-directory>
touch manifest.json main.mjs preview.html styles.css README.md
```
> mjs utilises JavaScript modules.
```
├── components-folder
│   └── component-directory
│       ├── main.mjs
│       ├── manifest.json
│       ├── preview.html
│       └── README.md
```

## Running the Component Locally

Open the IDE or local terminal:

Check the current file directory with `ls` it should show the component folder created earlier.

To run the component locally, use the following command:

`dxp-next cmp dev-ui <component-directory>`

The output should look like the following:

```
.../node/v20.18.0/lib/node_modules/@squiz/dxp-cli-next/node_modules/@squiz/local-component-dev-ui/lib/server
YYYY-MM-DDTHH:MM:SS.DDDZ info: Edge Component development webserver started on port http://localhost:5555
YYYY-MM-DDTHH:MM:SS.DDD3Z info: UI started on port http://localhost:3000
```

The UI will be started on the localhost which can be accessed through your default web browser at: `http://localhost:3000`

The Backend server will be started on the localhost which can be accessed: `http://localhost:5555`

## Next Steps
You can now start editing the component files to create the desired functionality for your Squiz DXP component.

To stop the local server, go to your terminal and press `CTRL + C`