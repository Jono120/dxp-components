# Connecting DXP Component Library to Squiz Matrix 6

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Initial Setup](#initial-setup)
- [Matrix 6 Configuration](#matrix-6-configuration)
- [GitBridge Integration](#gitbridge-integration)
- [Component Deployment Workflow](#component-deployment-workflow)
- [Matrix-Specific Component Types](#matrix-specific-component-types)
- [Environment Configuration](#environment-configuration)
- [Component Access and Permissions](#component-access-and-permissions)
- [manifest.json and Static Files](#manifestjson-and-static-files)
- [DXP Component Library Reference](#important-dxp-component-library-reference)
- [Testing Integration](#testing-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

This guide provides comprehensive instructions for integrating the DXP Component Library with Squiz Matrix 6. The integration enables content editors to use Edge Components within Matrix's CMS interface while maintaining version control, automated deployments, and a modern development workflow.

### What This Integration Enables

- **Edge Components in Matrix**: Deploy components to Squiz DXP and use them in Matrix 6 pages
- **GitBridge Sync**: Automatic synchronization of built assets (CSS/JS) from Git to Matrix
- **Visual Page Builder**: Inline editing capabilities within Matrix's preview interface
- **Matrix Data Integration**: Components can fetch data from Matrix assets via REST API
- **Version Management**: Component versioning with semantic versioning (SemVer)
- **Environment Separation**: Different configurations for dev/staging/production

---

## Prerequisites

### Required Software

1. **Git** - Version control system
   - See [installing-git.md](installing-git.md) for installation instructions
   
2. **Node.js and npm** - JavaScript runtime and package manager
   - Recommended: Use [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm)
   - Version: Check [.nvmrc](.nvmrc) for required Node version
   ```bash
   nvm install
   nvm use
   ```

3. **DXP CLI** - Squiz DXP command-line interface
   ```bash
   npm install --global @squiz/dxp-cli-next
   ```

### Required Access

- **Squiz DXP Account**: Access to your organization's DXP tenant
- **Matrix 6 Instance**: Admin or appropriate permissions to:
  - Create and configure sites
  - Set up GitBridge
  - Create Asset Listings and API endpoints
  - Deploy designs and paint layouts
- **Git Repository**: Access to push/pull from your Git hosting platform (GitHub, GitLab, Bitbucket)

### Matrix 6 Requirements

- Matrix 6.x or higher
- Component Service enabled on your Matrix instance
- API Site configured for component data endpoints
- GitBridge feature enabled

---

## Architecture Overview

### Component Flow Diagram

```
┌─────────────────┐
│  Developer      │
│  Workstation    │
└────────┬────────┘
         │
         │ 1. Develop & Test Locally (npm run dev)
         │
         ▼
┌─────────────────┐
│   Git Repo      │  ◄── 2. Push code changes
│  (GitHub/Lab)   │
└────────┬────────┘
         │
         │ 3. GitBridge syncs /dist assets
         │
         ▼
┌─────────────────────────────────────────────┐
│            Squiz Matrix 6                   │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │  GitBridge   │    │  Component Set   │   │
│  │  (CSS/JS)    │◄───┤  Configuration   │   │
│  └──────────────┘    └──────────────────┘   │
│                                             │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │  API Site    │    │  Visual Page     │   │
│  │  (REST API)  │◄───┤  Builder         │   │
│  └──────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────┘
         │
         │ 4. Deploy components (dxp-next cmp deploy)
         │
         ▼
┌─────────────────┐
│   Squiz DXP     │
│  (Edge Runtime) │  ◄── 5. Components execute at edge
└─────────────────┘
         │
         │ 6. Render on published pages
         │
         ▼
┌─────────────────┐
│   End Users     │
└─────────────────┘
```

### Key Integration Points

1. **Code Repository** → **Matrix GitBridge**: Syncs built CSS/JS files
2. **DXP CLI** → **Squiz DXP**: Deploys component logic (main.js)
3. **Matrix API Site** → **Components**: Provides data for dynamic components
4. **Component Sets** → **Matrix Sites**: Makes components available to editors
5. **Visual Page Builder** → **Inline Editing**: Enables WYSIWYG editing

---

## Initial Setup

### 1. Clone and Configure Repository

```bash
# Clone the repository
git clone git@github.com:squizlabs/dxp-component-library.git
cd dxp-component-library

# Install dependencies
npm install

# Use correct Node version
nvm use
```

### 2. Authenticate with Squiz DXP

**Login to your DXP tenant:**

```bash
# Default authentication (AU region)
dxp-next auth login --tenant={your-tenant-id}

# Example:
# dxp-next auth login --tenant=acme-corp
```

**Advanced Authentication Options:**

```bash
# Specify DXP base URL
dxp-next auth login --dxp-base-url https://example.dxp.squiz.cloud/ --tenant=acme-corp

# Specify region (default is 'au')
dxp-next auth login --region au --tenant=acme-corp

# Override existing session
dxp-next auth login --override-session --tenant=acme-corp
```

**Authentication Details:**

- Command opens your default browser to complete the authentication flow
- Credentials are stored locally in `.dxp/` directory (gitignored, do not commit)
- The DXP CLI stores your session so subsequent commands use the authenticated context
- To verify authentication status: `dxp-next auth`
- For Windows Subsystem for Linux (WSL) users: Ensure `xdg-utils` is installed:
  ```bash
  sudo apt-get update
  sudo apt-get install xdg-utils
  ```

**Key Points:**

- **Tenant ID**: Your organization's unique identifier in the DXP platform
- **DXP Base URL**: Typically `https://dxp.squiz.cloud` (default)
- **Region**: AU (Australia) is the default region
- **Credentials**: Your browser will guide you through authentication
- **Session Storage**: Do not share or commit the `.dxp/` directory

### 3. Configure Environment Variables

Create a `.env` file in the project root (this is gitignored):

```bash
cp .example.env .env
```

Edit `.env` with your Matrix configuration:

```env
BASE_DOMAIN="https://your-matrix-domain.com/"
BASE_PATH="your-site-path/_api/components/"
API_IDENTIFIER="your-component-service-identifier"
```

**Where to find these values:**

- **BASE_DOMAIN**: Your Matrix instance URL (e.g., `https://cms.acme.com/`)
- **BASE_PATH**: Path to your API site's component endpoints (e.g., `mysite/_api/components/`)
- **API_IDENTIFIER**: Found in Matrix:
  1. Navigate to your Site asset
  2. Go to the **DXP Configuration** screen
  3. Copy the **Component Service API Identifier**

---

## Matrix 6 Configuration

### 1. Create API Site Structure

In Matrix, create the following structure for component data endpoints:

```
Site Asset (Your Website)
└── _api (Folder)
    └── components (Folder)
        ├── cards-listing (Asset Listing)
        ├── content-items (Asset Listing)
        └── Configuration (Folder)
            ├── JSON Design (Design Asset)
            └── Asset Contents Only (Paint Layout)
```

### 2. Configure JSON Design

**Create a Design Asset:**

1. Create a new Design in the Configuration folder
2. Name it: `JSON Design`
3. In the **Design Details** screen, select **Design Type**: `File Design`

**Design Body:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body>
%body_contents%
</body>
</html>
```

**Customization Section:**

```html
<script runat="server">
    response.setContentType("application/json");
</script>
```

This sets the proper JSON content-type header for API responses.

### 3. Configure Paint Layout

**Create Paint Layout:**

1. Create a new Paint Layout in the Configuration folder
2. Name it: `Asset Contents Only`

**Layout Configuration:**

```html
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html>
<head>
<MySource_PRINT id_name="head" />
</head>
<body>
<MySource_AREA id_name="body" design_area="body">
    <MySource_SET name="position" value="page_contents" />
</MySource_AREA>
</body>
</html>
```

This paint layout outputs only the asset contents without site-wide headers/footers.

### 4. Create Asset Listing for Component Data

Example: **Cards Listing** (for cards-matrix component)

**Details Screen Configuration:**

- **Asset types to list**: Standard Page, Content Page (or your custom types)
- **Root nodes**: Select your website Site asset
- **Dynamic parameters**: Add parameter
  - **Type**: Array of specific asset IDs or selection group
  - **GET Variable Name**: `ids`
  - **Description**: Comma-separated list of asset IDs to retrieve

**Page Contents (Body):**

```javascript
<script runat="server">
    // Declare our output variable
    const output = [];

    // Set all the data from each listing item
    %asset_listing%

    // Output the JSON
    print(JSON.stringify(output));
</script>
```

**Default Format (for listed asset types):**

```javascript
(() => {
    let data = {
        "id": "%asset_assetid^json_encode%",
        "heading": "%asset_name^json_encode%",
        "link": "%asset_url^json_encode%",
        "summary": "%asset_metadata_description^json_encode%"
    }

    // Add the thumbnail, if it exists
    const image = "%asset_thumbnail_assetid%";
    if (image !== "" && image !== null) {
        data.image = {
            "url": "%asset_thumbnail_assetid^as_asset:asset_url^json_encode%",
            "attributes": {
                "id": "%asset_thumbnail_assetid^json_encode%",
                "alt": "%asset_thumbnail_assetid^as_asset:asset_attribute_alt^json_encode%",
                "width": "%asset_thumbnail_assetid^as_asset:asset_attribute_width^json_encode%",
                "height": "%asset_thumbnail_assetid^as_asset:asset_attribute_height^json_encode%"
            }
        };
    }

    output.push(data);
})();
```

**Page Contents (No Results):**

```json
[]
```

**Designs Screen:**
- Apply the **JSON Design** to all types

**Paint Layouts Screen:**
- Apply the **Asset Contents Only** paint layout

**Test the Endpoint:**

Make the asset listing Live and test:
```
https://your-matrix-domain.com/your-site/_api/components/cards-listing?ids=12345,67890
```

You should receive JSON data for the specified asset IDs.

### 5. Configure Component Service on Site Asset

The Component Service must be configured to connect your Matrix instance with the DXP platform. This requires three steps based on official Squiz documentation:

**Step 1: Set up Content API Token in Matrix**

1. Navigate to your **Site asset** in Matrix
2. Go to **Admin** → **System Management** → **Content API Tokens**
3. Create a new Content API token with appropriate permissions
4. Copy the token (you'll need it in the DXP Console)
5. Keep this token secure (treat it like a password)

**Step 2: Configure API Identifier in DXP Console**

1. Login to [DXP Console](https://console.squiz.net)
2. Navigate to **Component Service** → **Configuration**
3. Create a new API Identifier mapping:
   - **Name**: Your API identifier (e.g., `my-site-api`)
   - **Matrix Instance**: Your Matrix domain URL
   - **Content API Token**: Paste the token from Step 1
4. Save the configuration
5. Copy the **API Identifier** (you'll need it in `.env`)

**Step 3: Link API Identifier to Site Asset**

1. Navigate to your **Site asset** in Matrix
2. Go to the **DXP Configuration** screen
3. In the **Component Service** section:
   - **Enable**: Check this box to enable Component Service
   - **API Identifier**: Enter or select the API identifier created in Step 2
   - **Component Sets**: Add component sets that use your components
4. Save changes

**Important Notes:**

- The API identifier must match between Matrix and DXP Console configurations
- Component Service is independent from Matrix and requires this connection
- Content API tokens should be kept secure and rotated regularly
- Multiple API identifiers can be created for different environments (dev, staging, prod)

---

## GitBridge Integration

GitBridge synchronizes your built CSS and JavaScript files from Git to Matrix, making them available for your components.

### 1. Build Assets for Production

Before setting up GitBridge, build your production assets:

```bash
npm run build
```

This creates the `/dist` folder with:
- `main.css` - Compiled styles for all components
- `main.js` - Compiled client-side JavaScript
- `server.js` - Server-side rendering logic
- `images/` - Optimized images

### 2. Commit and Push Built Assets

```bash
git add dist/
git commit -m "Build production assets for GitBridge"
git push origin main
```

**Important:** While `dist/` is typically gitignored in development projects, you **must commit it** for GitBridge to sync the files to Matrix.

Update your `.gitignore` if needed:

```ignore
# Keep dist for GitBridge
# dist/

# But ignore these
dist-ssr/
node_modules/
```

### 3. Create GitBridge Asset in Matrix

1. In Matrix Admin, go to your Site asset
2. Under the Site asset, create a **GitBridge** asset
3. Name it: `DXP Components Bridge`

### 4. Configure GitBridge Settings

**Connection Tab:**

- **Repository URL**: Your Git repository URL
  - HTTPS: `https://github.com/your-org/dxp-component-library.git`
  - SSH: `git@github.com:your-org/dxp-component-library.git`
- **Branch**: `main` (or your production branch)
- **Authentication**: Configure based on your Git host
  - GitHub: Use Personal Access Token or Deploy Key
  - GitLab: Use Deploy Token
  - Bitbucket: Use App Password

**Mapping Tab:**

Map the `/dist` folder to a location in Matrix:

```
Source Path (Git)          →  Destination (Matrix)
──────────────────────────────────────────────────
dist/main.css              →  _designs/dxp-components/main.css
dist/main.js               →  _designs/dxp-components/main.js
dist/images/               →  _designs/dxp-components/images/
```

**Settings:**

- **Auto-sync**: Enable (syncs on Git push via webhook)
- **Sync interval**: 5 minutes (fallback polling)
- **Delete removed files**: Enable
- **Create missing assets**: Enable

### 5. Initial Sync

1. Click **Sync Now** to perform the initial synchronization
2. Verify files appear under your destination path
3. Make the Design Files **Live**

### 6. Reference Assets in Components

Update your component preview HTML to reference the synced assets:

**Edit `preview.html` in each component:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="./?a=<ASSETID_OF_MAIN_CSS>:v<VERSION>" />
</head>
<body>
    <!--APP-->
    <script src="./?a=<ASSETID_OF_MAIN_JS>:v<VERSION>"></script>
</body>
</html>
```

Replace `<ASSETID_OF_MAIN_CSS>` and `<ASSETID_OF_MAIN_JS>` with the actual Matrix asset IDs of your synced files.

**Pro Tip**: Use Matrix keyword replacements for dynamic paths:

```html
<link rel="stylesheet" href="%globals_asset_url:123456%" />
<script src="%globals_asset_url:123457%"></script>
```

---

## DXP CLI Commands Reference

This section provides quick reference for the most commonly used DXP CLI commands for component development.

### Authentication Commands

```bash
# Check current authentication status
dxp-next auth

# Login to DXP tenant
dxp-next auth login --tenant={tenant-id}

# Login with custom base URL
dxp-next auth login --dxp-base-url https://example.dxp.squiz.cloud/ --tenant={tenant-id}

# Override existing session
dxp-next auth login --override-session
```

### Component Service (cmp) Commands

```bash
# Get help for component commands
dxp-next cmp --help

# Local development - start dev server
dxp-next cmp dev ./dxp/component-service/accordion

# Local development with UI - enhanced development interface
dxp-next cmp dev-ui ./dxp/component-service

# List deployed components
dxp-next cmp list --namespace edge-dxp-comp-lib

# Get component information
dxp-next cmp info edge-dxp-comp-lib/accordion

# Deploy edge component (REQUIRED feature flag)
FEATURE_EDGE_COMPONENTS=true dxp-next cmp deploy ./dxp/component-service/accordion

# Deploy and specify tenant
FEATURE_EDGE_COMPONENTS=true dxp-next cmp deploy \
  --tenant=acme-corp \
  ./dxp/component-service/accordion
```

### Key Command Options

**Global Options:**
- `-h, --help` - Display help for command
- `-V, --version` - Output version number

**Deploy Options:**
- `--tenant <string>` - Tenant ID to deploy to
- `--component-service-url <string>` - Override component service URL
- `--help` - Display command help

**Authentication Options:**
- `--dxp-base-url <url>` - DXP cloud base URL
- `--region <region>` - Region (default: au)
- `--override-session` - Override existing authorized session
- `--tenant <id>` - Tenant ID

---

## Local Development Preview Servers

When you run `npm run dev` or `dxp-next cmp dev-ui`, three development servers are started:

### Port 4000 - Main Development Frontend

- **URL**: `http://localhost:4000`
- **Purpose**: Full development interface with HMR (Hot Module Replacement)
- **Features**:
  - View all components
  - See component rendering with styles and scripts
  - Automatic reload on code changes
  - Linked styles and scripts for development
- **Use Case**: Primary development interface

### Port 5555 - Raw Component Preview

- **URL**: `http://localhost:5555`
- **Purpose**: Raw edge component preview without UI
- **Features**:
  - Tests component rendering at edge
  - Minimal UI, raw component output
  - Tests component logic without additional layers
- **Use Case**: Testing component output format, debugging rendering issues

### Port 3000 - CMS-like Field Configuration UI

- **URL**: `http://localhost:3000`
- **Purpose**: Simulates Matrix field setup interface
- **Features**:
  - Preview how fields appear in Matrix admin
  - Test field configurations
  - Simulate Matrix data types (SquizImage, SquizLink, etc.)
  - Inline editing preview
- **Use Case**: Testing field configurations before Matrix deployment

**Accessing Previews:**

```bash
# Start all dev servers
npm run dev

# Then open in browser:
# http://localhost:4000 - Main dev interface
# http://localhost:5555 - Raw component preview
# http://localhost:3000 - CMS field configuration
```

---



### 1. Development Phase

**Local Development:**

```bash
# Start dev servers
npm run dev
```

This starts three development servers:
- **Port 4000**: Frontend with HMR (Hot Module Replacement)
- **Port 5555**: Raw component preview server
- **Port 3000**: CMS-like field configuration UI

**Test Locally:**
- View components at `http://localhost:4000`
- Test field configurations at `http://localhost:3000`
- Verify component rendering at `http://localhost:5555`

### 2. Version Your Component

Before deploying, update the version in `manifest.json` following [Semantic Versioning](https://semver.org/):

```json
{
  "name": "accordion",
  "namespace": "edge-dxp-comp-lib",
  "version": "2.1.0",  // ← Update this
  "type": "edge"
}
```

**Version Guidelines:**
- **MAJOR** (2.0.0): Breaking changes
- **MINOR** (2.1.0): New features, backward compatible
- **PATCH** (2.1.1): Bug fixes

### 3. Build Production Assets

```bash
# Build for production
npm run build

# This runs:
# - npm run build:client (Vite client build)
# - npm run build:server (Vite SSR build)
# - Component compilation (esbuild)
```

Verify the build output:
```bash
ls dist/
# Should show: main.css, main.js, server.js, images/

ls dxp/component-service/accordion/
# Should show: main.cjs (compiled component)
```

### 4. Commit and Push Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: add accordion component v2.1.0"

# Push to repository
git push origin main
```

**GitBridge will automatically sync** the updated `/dist` files to Matrix.

### 5. Deploy Component to DXP

**Important: Edge Component Deployment Requirements**

This library deploys Edge Components, which require special configuration per official DXP documentation:

```bash
# REQUIRED: Enable edge component feature flag
FEATURE_EDGE_COMPONENTS=true dxp-next cmp deploy ./dxp/component-service/accordion
```

**Deploy Single Component:**

```bash
# Using npm script (automatically includes feature flag)
npm run deploy --name=accordion

# Manual deployment
FEATURE_EDGE_COMPONENTS=true dxp-next cmp deploy ./dxp/component-service/accordion

# Deploy to specific tenant
FEATURE_EDGE_COMPONENTS=true dxp-next cmp deploy \
  --tenant=acme-corp \
  ./dxp/component-service/accordion

# Override component service URL
FEATURE_EDGE_COMPONENTS=true dxp-next cmp deploy \
  --component-service-url https://custom-dxp-url.com \
  ./dxp/component-service/accordion
```

**Edge Component Deployment Details:**

- **Feature Flag Required**: `FEATURE_EDGE_COMPONENTS=true` must be set before deploying
- **No Static Files**: Edge components cannot include static files. If your manifest.json includes `staticFiles`, remove them or the deployment will fail with error: `Static files are not supported in edge and have been removed.`
- **Deploy Command Syntax**:
  ```bash
  dxp-next cmp deploy [options] <source>
  ```
  - `<source>`: Folder path containing component template files
  - `--tenant <string>`: Tenant ID to deploy to (optional, uses configured tenant if omitted)
  - `--component-service-url <string>`: Override the component service URL
  - `--help`: Display command help

**Common Edge Component Issues:**

| Issue | Solution |
|-------|----------|
| `FEATURE_EDGE_COMPONENTS not set` | Prefix command with `FEATURE_EDGE_COMPONENTS=true` |
| `Static files not supported error` | Remove `staticFiles` section from manifest.json |
| `Tenant not found` | Verify you're logged in: `dxp-next auth` |
| `Component validation failed` | Check manifest.json schema and component entry points |

**Deployment Output:**

After successful deployment, you'll see:
```
✓ Component deployed successfully
✓ Namespace: edge-dxp-comp-lib
✓ Name: accordion
✓ Version: 2.1.0
```

**Deploy All Components** (using vermgmt):

```bash
# Interactive version management
npm run vermgmt

# Follow prompts to:
# 1. Select components to deploy
# 2. Confirm versions
# 3. Deploy in batch
```

### 6. Create/Update Component Set in DXP

**First-Time Deployment:**

After deploying a component for the first time, create a Component Set:

1. Login to [DXP Console](https://console.squiz.net)
2. Navigate to **Component Sets**
3. Click **Create New Set**
4. Configure:
   - **Name**: `Production Components`
   - **Description**: `Components for Matrix 6 site`
   - **Environment Variables**: Add your env vars (see below)
5. Click **Add Components**
6. Search for your component: `edge-dxp-comp-lib/accordion`
7. Select version `2.1.0`
8. Save the set

**Subsequent Deployments:**

The DXP Console will show the new version available. Update the component set to use the latest version.

### 7. Configure Environment Variables in Component Set

In the Component Set configuration, add environment variables required by your components:

```
Name              | Value                                        | Required
─────────────────────────────────────────────────────────────────────
API_IDENTIFIER    | your-matrix-api-identifier                  | Yes
BASE_DOMAIN       | https://your-matrix-domain.com/             | Yes
BASE_PATH         | your-site/_api/components/                  | Yes
```

**Important:** These values may differ from your local `.env` file. Use production Matrix URLs here.

### 8. Make Component Set Available in Matrix

1. In Matrix, navigate to your **Site asset**
2. Go to **DXP Configuration** screen
3. In **Component Sets** section, add your component set
4. Click **Save**

Now editors can use your components when building pages!

---

## Matrix-Specific Component Types

### Using SquizImage

The `SquizImage` type integrates with Matrix's DAM (Digital Asset Manager):

**manifest.json:**

```json
{
  "properties": {
    "image": {
      "type": "SquizImage",
      "title": "Image",
      "description": "Select an image from Matrix DAM"
    }
  }
}
```

**main.js:**

```javascript
export default {
  async main({ image }) {
    // SquizImage provides full image object
    return html`
      ${image?.url
        ? `<img 
            src="${image.url}" 
            alt="${image.attributes?.alt || ''}" 
            width="${image.attributes?.width || ''}" 
            height="${image.attributes?.height || ''}"
          />`
        : ''}
    `;
  }
};
```

**Data Structure:**

```json
{
  "image": {
    "url": "https://cdn.example.com/image.jpg",
    "attributes": {
      "id": "123456",
      "alt": "Descriptive text",
      "width": "1200",
      "height": "800"
    }
  }
}
```

### Using SquizLink

The `SquizLink` type provides Matrix link selection with target options:

**manifest.json:**

```json
{
  "properties": {
    "link": {
      "type": "SquizLink",
      "title": "Link",
      "description": "Select a link destination"
    }
  }
}
```

**main.js:**

```javascript
export default {
  async main({ link }) {
    return html`
      ${link
        ? `<a href="${link.url}" target="${link.target || '_self'}">
            ${xssSafeContent(link.text)}
          </a>`
        : ''}
    `;
  }
};
```

**Data Structure:**

```json
{
  "link": {
    "text": "Learn More",
    "url": "https://example.com/page",
    "target": "_blank"
  }
}
```

### Using matrix-asset-uri

The `matrix-asset-uri` format enables asset selection and data fetching:

**manifest.json:**

```json
{
  "properties": {
    "cards": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "asset": {
            "type": "string",
            "format": "matrix-asset-uri",
            "title": "Select Asset"
          }
        }
      }
    }
  },
  "environment": [
    {
      "name": "API_IDENTIFIER",
      "required": true
    },
    {
      "name": "BASE_DOMAIN",
      "required": true
    },
    {
      "name": "BASE_PATH",
      "required": true
    }
  ]
}
```

**main.js:**

```javascript
export default {
  async main({ cards }, info) {
    const { API_IDENTIFIER, BASE_DOMAIN, BASE_PATH } = info.env || {};

    // Extract asset IDs from URIs
    // matrix-asset://api-id/12345 → 12345
    const ids = cards
      .map(card => card.asset.replace(`matrix-asset://${API_IDENTIFIER}/`, ''))
      .join(',');

    // Fetch data from Matrix API
    const response = await fetch(`${BASE_DOMAIN}${BASE_PATH}cards?ids=${ids}`);
    const cardsData = await response.json();

    // Render cards with fetched data
    return html`
      <ul class="cards">
        ${cardsData.map(card => html`
          <li class="card">
            <h3>${xssSafeContent(card.heading)}</h3>
            ${card.image?.url 
              ? `<img src="${card.image.url}" alt="${card.image.attributes.alt}" />`
              : ''}
            <a href="${card.link}">Read More</a>
          </li>
        `).join('')}
      </ul>
    `;
  }
};
```

**See Full Examples:**
- [cards-matrix component](dxp/component-service/cards-matrix/)
- [cards-root component](dxp/component-service/cards-root/)

---

## Environment Configuration

### Understanding Environment Variables in Component Service

Per official Squiz documentation, environment variables allow components to behave differently across environments (dev, staging, production) and securely store sensitive configuration.

**Key Points:**

- Environment variables are **set at the Component Set level** in DXP Console
- Variables can be **overridden per component** if needed
- Variables **cannot be set on the component itself** outside of component sets
- Used for API keys, URLs, authentication credentials, and feature flags

### Local Development (.env)

Create a `.env` file in the project root for local development:

```env
# Local development configuration
BASE_DOMAIN="https://cms-dev.acme.com/"
BASE_PATH="dev-site/_api/components/"
API_IDENTIFIER="dev-api-identifier"

# Optional: additional variables
NODE_ENV="development"
DEBUG="true"
CACHE_TIMEOUT="300"
```

**Setup Steps:**

1. Copy example: `cp .example.env .env`
2. Edit with your values (`.env` is gitignored)
3. Declare variables in component manifest.json `environment` section
4. Access in component code via `info.env`

### Production Configuration in DXP Console

**Add Environment Variables to Component Set:**

1. Login to [DXP Console](https://console.squiz.net)
2. Navigate to **Component Sets**
3. Select or create your component set
4. Go to **Environment Variables** section
5. Add variables:

```
Name              | Value                              | Required | Type
──────────────────────────────────────────────────────────────────────
API_IDENTIFIER    | prod-api-identifier                | Yes      | String
BASE_DOMAIN       | https://cms.acme.com/              | Yes      | String
BASE_PATH         | production-site/_api/components/   | Yes      | String
API_KEY           | your-secure-api-key                | No       | Secret
FEATURE_FLAG      | true                               | No       | Boolean
```

6. Save changes

**Component-Level Overrides:**

Variables can be overridden for specific components:

1. Within the Component Set, expand component
2. Click **Environment Variables**
3. Override specific variables for that component
4. Save

### Declaring Environment Variables in manifest.json

```json
{
  "name": "cards-matrix",
  "namespace": "edge-dxp-comp-lib",
  "version": "2.1.0",
  "environment": [
    {
      "name": "API_IDENTIFIER",
      "required": true,
      "description": "The component service API identifier from Matrix"
    },
    {
      "name": "BASE_DOMAIN",
      "required": true,
      "description": "Your Matrix instance domain (e.g., https://cms.acme.com/)"
    },
    {
      "name": "BASE_PATH",
      "required": true,
      "description": "Path to your API site components folder"
    },
    {
      "name": "CACHE_TIMEOUT",
      "required": false,
      "description": "Cache timeout in seconds (default: 300)"
    },
    {
      "name": "DEBUG_MODE",
      "required": false,
      "description": "Enable debug logging"
    }
  ],
  "functions": [...]
}
```

### Using Environment Variables in Components

Access variables via the `info` parameter in your component function:

```javascript
export default {
  async main(data, info) {
    // Get environment variables
    const { API_IDENTIFIER, BASE_DOMAIN, BASE_PATH } = 
      info.env || (info.set && info.set.environment) || {};

    // Check if required variables are available
    if (API_IDENTIFIER && BASE_DOMAIN && BASE_PATH) {
      // Use real configuration
      const url = `${BASE_DOMAIN}${BASE_PATH}cards?ids=${ids}`;
      const response = await fetch(url);
      return await response.json();
    } else {
      // Fallback to mock data
      console.warn('Environment variables not set, using mock data');
      return mockData;
    }
  }
};
```

### Environment Variable Best Practices

1. **Always provide fallbacks**
   - Components should work with mock data if env vars missing
   - Enables testing without full Matrix setup

2. **Separate by environment**
   - Use different API identifiers for dev/staging/prod
   - Different Matrix instances for each environment

3. **Secure sensitive data**
   - Treat API keys like passwords
   - Use DXP Console for production secrets
   - Never commit `.env` files

4. **Document requirements**
   - List all required environment variables in manifest.json
   - Include descriptions
   - Note which are required vs optional

5. **Version with changes**
   - If environment variables change, update component version
   - Document new variables in CHANGELOG

### Common Environment Variable Scenarios

**Scenario 1: Multi-Environment Component**

```javascript
export default {
  async main({ title }, info) {
    const { API_ENDPOINT, CACHE_ENABLED } = info.env || {};
    
    if (!API_ENDPOINT) {
      return mockData; // Development fallback
    }
    
    const cacheKey = CACHE_ENABLED ? `cache_${title}` : null;
    const data = await fetchData(API_ENDPOINT, cacheKey);
    return render(data);
  }
};
```

**Scenario 2: Feature Flags**

```javascript
export default {
  async main(data, info) {
    const { BETA_FEATURES_ENABLED } = info.env || {};
    
    if (BETA_FEATURES_ENABLED === 'true') {
      // Render new feature
      return renderBetaVersion(data);
    }
    
    // Render stable version
    return renderStableVersion(data);
  }
};
```

**Scenario 3: API Credential Rotation**

```javascript
export default {
  async main(data, info) {
    const { API_KEY_V1, API_KEY_V2, USE_V2_KEY } = info.env || {};
    
    const apiKey = USE_V2_KEY === 'true' ? API_KEY_V2 : API_KEY_V1;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    return await response.json();
  }
};
```

---

## Important: DXP Component Library Reference

This repository is built on the **DXP Component Library**, which provides best practice examples and patterns for component development with Squiz DXP.

**Official Resources:**

- [DXP Component Library Documentation](https://docs.squiz.net/component-service/latest/getting-started/dxp-component-library.html)
- [Component Service Getting Started](https://docs.squiz.net/component-service/latest/getting-started/index.html)
- [Build a Basic Component Tutorial](https://docs.squiz.net/component-service/latest/tutorials/server-components/build-a-basic-component/index.html)

**Key Components in This Library:**

- **Accordion** - Collapsible content sections
- **Banner** - Hero/promotional banners with images and CTAs
- **Card Components** - Multiple card variations (manual, Matrix-sourced, root-sourced)
- **Image-Text Row** - Flexible image and text combinations
- **Icon Cards** - Cards with icons and descriptions
- **Testimonials** - Testimonial/review sections
- **And more** - See [dxp/component-service/](dxp/component-service/) for full list

**Learning Path:**

1. ✅ Understand component structure (you're reading this!)
2. ✅ Review examples in [dxp/component-service/](dxp/component-service/)
3. ✅ Read [File structure documentation](https://docs.squiz.net/component-service/latest/getting-started/file-structure.html)
4. ✅ Study [manifest.json reference](https://docs.squiz.net/component-service/latest/getting-started/manifest-json.html)
5. ✅ Follow [build a basic component tutorial](https://docs.squiz.net/component-service/latest/tutorials/server-components/build-a-basic-component/index.html)
6. ✅ Complete this Matrix 6 integration guide

---

## Component Access and Permissions

### DXP Console Access Requirements

To deploy and manage components, you need **Developer access** to Squiz DXP Console with:

- Component Service enabled
- Permission to create/update components
- Permission to manage component sets
- Permission to configure environment variables

**Contact Customer Success if you don't have:**
- Access to [DXP Console](https://console.squiz.net)
- Component Service feature available
- Required permissions for your tenant

### Local Development Requirements

Good news: You can develop components **locally without any DXP access**!

- No Squiz DXP account needed
- No Matrix 6 instance needed
- Just Node.js and npm
- All dependencies in [package.json](package.json)

**When DXP Access is Required:**
- Deploying components
- Managing component sets
- Configuring production environments
- Sharing components with teams

---

## manifest.json and Static Files

### manifest.json Overview

The `manifest.json` file is critical - it defines your component's:
- Metadata (name, version, namespace)
- Input schema (what editors configure)
- Functions and entry points
- Environment variables
- Previews

**Reference:** [manifest.json documentation](https://docs.squiz.net/component-service/latest/getting-started/manifest-json.html)

### Static Files Limitation for Edge Components

**IMPORTANT:** Edge components **cannot use static files**.

**If you need static files:**
- Move images to GitBridge-synced `/dist` folder
- Reference them via URLs in component code
- Or convert to server components (contact Squiz Support)

**Example - Wrong (will fail):**

```json
{
  "name": "my-component",
  "type": "edge",
  "staticFiles": {
    "path": "./static/"  // ❌ NOT ALLOWED FOR EDGE COMPONENTS
  }
}
```

**Example - Correct (use GitBridge):**

```json
{
  "name": "my-component",
  "type": "edge",
  "functions": [{
    "name": "main",
    "entry": "main.js"
    // No staticFiles section
  }]
}
```

**In your component code:**

```javascript
// Reference images via URL from GitBridge sync
export default {
  async main(data) {
    return html`
      <img src="/_designs/dxp-components/images/logo.png" alt="Logo" />
    `;
  }
};
```

---

## Testing Integration

**Example - Correct (use GitBridge):**

```json
{
  "name": "my-component",
  "type": "edge",
  "functions": [{
    "name": "main",
    "entry": "main.js"
    // No staticFiles section
  }]
}
```

**In your component code:**

```javascript
// Reference images via URL from GitBridge sync
export default {
  async main(data) {
    return html`
      <img src="/_designs/dxp-components/images/logo.png" alt="Logo" />
    `;
  }
};
```

---

## Troubleshooting

### Component Not Appearing in Matrix

**Symptoms:** Component not available in Visual Page Builder

**Solutions:**

1. **Verify deployment:**
   ```bash
   dxp-next cmp list --namespace edge-dxp-comp-lib
   ```

2. **Check component set:**
   - Login to DXP Console
   - Verify component is added to set
   - Verify component set is linked to Matrix site

3. **Check Matrix DXP Configuration:**
   - Ensure Component Service is enabled on site asset
   - Verify correct component set is selected
   - Check API identifier matches

### Styles Not Loading

**Symptoms:** Component renders but has no styling

**Solutions:**

1. **Verify GitBridge sync:**
   - Check GitBridge asset in Matrix
   - Click "Sync Now" to force update
   - Verify `main.css` is Live status

2. **Check preview.html references:**
   ```html
   <!-- Verify correct asset ID -->
   <link rel="stylesheet" href="./?a=123456:v123" />
   ```

3. **Inspect browser console:**
   - Check for 404 errors
   - Verify CSS file URL resolves correctly

4. **Cache issues:**
   - Clear Matrix cache: Admin → System Management → Cache Manager
   - Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Data Not Fetching from Matrix

**Symptoms:** Components show mock data or errors

**Solutions:**

1. **Verify environment variables:**
   - Check DXP Console → Component Set → Environment Variables
   - Ensure BASE_DOMAIN, BASE_PATH, API_IDENTIFIER are correct

2. **Test API endpoint directly:**
   ```bash
   curl "https://your-matrix.com/site/_api/components/cards?ids=12345"
   ```

3. **Check Asset Listing configuration:**
   - Verify Dynamic Parameters are set correctly
   - Ensure asset listing is Live
   - Test with known Live asset IDs

4. **Review component logs:**
   - Check browser console for fetch errors
   - Look for CORS issues (ensure Matrix API allows requests)

5. **Verify permissions:**
   - API user has read access to listed assets
   - Assets are Live (not Under Construction)

### Inline Editing Not Working

**Symptoms:** Can't edit fields in Visual Page Builder

**Solutions:**

1. **Check data-sq-field attributes:**
   ```javascript
   // Ensure proper field paths
   <h2 data-sq-field="title">${title}</h2>
   <p data-sq-field="accordion[0].content">${content}</p>
   ```

2. **Verify ui:metadata in manifest:**
   ```json
   {
     "properties": {
       "title": {
         "type": "string",
         "ui:metadata": {
           "inlineEditable": true  // ← Required
         }
       }
     }
   }
   ```

3. **Check Visual Page Builder is enabled:**
   - Matrix → Site Settings
   - Ensure Visual Page Builder feature is active

### Version Conflicts

**Symptoms:** Old component version shows after deployment

**Solutions:**

1. **Update component set:**
   - DXP Console → Component Sets
   - Click component → Select new version
   - Save changes

2. **Clear caches:**
   - Clear Matrix cache
   - Clear browser cache
   - Clear CDN cache (if applicable)

3. **Verify deployment:**
   ```bash
   dxp-next cmp info edge-dxp-comp-lib/accordion
   ```

### Build Errors

**Symptoms:** `npm run build` fails

**Solutions:**

1. **Check Node version:**
   ```bash
   node --version
   # Should match .nvmrc
   nvm use
   ```

2. **Clean install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check for syntax errors:**
   ```bash
   npm run lint:js
   npm run lint:css
   ```

4. **Review build logs:**
   - Look for specific error messages
   - Check component main.js for issues

---

## Best Practices

### Component Development

1. **Use Semantic HTML**
   - Prefer native elements (`<details>`, `<summary>`, `<button>`)
   - Ensure proper heading hierarchy
   - Use ARIA attributes where needed

2. **Sanitize All User Input**
   ```javascript
   import { xssSafeContent } from '../../utils/xss';
   
   // Always sanitize dynamic content
   ${xssSafeContent(userInput)}
   ```

3. **Provide Fallbacks**
   ```javascript
   // Always handle missing data
   ${image?.url 
     ? `<img src="${image.url}" alt="${image.attributes?.alt || ''}" />`
     : `<div class="placeholder"></div>`}
   ```

4. **Enable Inline Editing**
   ```javascript
   // Add data-sq-field for Visual Page Builder
   <h2 data-sq-field="title">${title}</h2>
   ```

### Matrix Integration

1. **Version Consistently**
   - Follow [SemVer](https://semver.org/)
   - Document breaking changes
   - Update CHANGELOG.md

2. **Test Before Deploying**
   ```bash
   npm test              # Unit tests
   npm run lint:js       # Code quality
   npm run lint:css      # Style quality
   ```

3. **Use Asset Listings Efficiently**
   - Limit returned data to what's needed
   - Cache responses where appropriate
   - Handle empty results gracefully

4. **Separate Concerns**
   - Keep presentation logic in components
   - Keep data fetching in dedicated functions
   - Keep business logic in Matrix

### GitBridge Management

1. **Commit Built Assets**
   - Always commit `/dist` folder
   - Tag releases: `git tag v2.1.0`
   - Use meaningful commit messages

2. **Optimize Assets**
   ```bash
   # Build optimizes automatically
   npm run build
   
   # Check output sizes
   ls -lh dist/
   ```

3. **Monitor Sync Status**
   - Check GitBridge regularly
   - Set up webhooks for auto-sync
   - Test after major updates

### Performance Optimization

1. **Minimize Component Size**
   - Remove unused dependencies
   - Tree-shake imports
   - Use native APIs where possible

2. **Optimize Images**
   - Use appropriate formats (WebP, AVIF)
   - Provide width/height attributes
   - Lazy load below-fold images

3. **Minimize API Calls**
   - Batch requests where possible
   - Cache frequently-accessed data
   - Use efficient Matrix asset listings

4. **Optimize CSS/JS Delivery**
   - Build minimizes automatically
   - Consider critical CSS inline
   - Defer non-critical JavaScript

### Security Best Practices

1. **Never Trust User Input**
   - Always use `xssSafeContent()`
   - Validate data shapes
   - Sanitize HTML content

2. **Protect Environment Variables**
   - Never commit `.env` files
   - Use different values per environment
   - Rotate secrets regularly

3. **Validate Matrix Data**
   ```javascript
   // Check data structure
   if (!Array.isArray(cardsData)) {
     console.error('Invalid data format');
     return mockData;
   }
   ```

4. **Use HTTPS Everywhere**
   - Matrix URLs should use HTTPS
   - API endpoints should use HTTPS
   - External resources should use HTTPS

### Documentation

1. **Update README.md for Each Component**
   - Describe purpose
   - Show property examples
   - Document Matrix setup requirements

2. **Comment Complex Logic**
   ```javascript
   // Extract asset ID from Matrix URI format
   // matrix-asset://api-id/12345 → 12345
   const id = uri.replace(`matrix-asset://${API_IDENTIFIER}/`, '');
   ```

3. **Maintain CHANGELOG**
   - Document version changes
   - Note breaking changes
   - List new features

### Team Collaboration

1. **Use Feature Branches**
   ```bash
   git checkout -b feature/new-banner-component
   # Make changes
   git commit -m "feat: add banner component"
   git push origin feature/new-banner-component
   # Create pull request
   ```

2. **Code Review Process**
   - Review manifest.json changes
   - Test components locally
   - Verify Matrix integration points

3. **Standardize Naming**
   - Component folders: lowercase-with-hyphens
   - Component names in manifests: match folder names
   - CSS classes: use BEM methodology

---

## Deployment Checklist

Use this checklist for each component deployment:

### Pre-Deployment

- [ ] Component tested locally (`npm run dev`)
- [ ] Unit tests pass (`npm test`)
- [ ] Linters pass (`npm run lint:js && npm run lint:css`)
- [ ] Version bumped in `manifest.json` (follow SemVer)
- [ ] README.md updated
- [ ] Changes committed to Git

### Build Phase

- [ ] Production build successful (`npm run build`)
- [ ] `/dist` folder contains updated assets
- [ ] Component compiled to `.cjs` format
- [ ] Built assets committed and pushed to Git

### Matrix Configuration

- [ ] API endpoints created (if needed)
- [ ] Asset Listings configured (if needed)
- [ ] Environment variables defined in `.env`
- [ ] GitBridge synced latest assets

### DXP Deployment

- [ ] Authenticated with DXP CLI (`dxp-next auth`)
- [ ] Component deployed (`npm run deploy --name=component-name`)
- [ ] Component visible in DXP Console
- [ ] Component added to appropriate Component Set
- [ ] Environment variables added to Component Set
- [ ] Component Set linked to Matrix site

### Testing

- [ ] Component appears in Visual Page Builder
- [ ] Field configurations work correctly
- [ ] Inline editing functions properly
- [ ] Data fetches from Matrix (if applicable)
- [ ] Styles load correctly
- [ ] Scripts execute correctly
- [ ] Component works on published page
- [ ] Accessibility checks pass
- [ ] Cross-browser testing complete

### Post-Deployment

- [ ] Update documentation
- [ ] Notify team of new version
- [ ] Monitor for errors in Matrix
- [ ] Tag release in Git (`git tag v2.1.0`)

---

## Additional Resources

### Official Documentation

- [Squiz DXP Documentation](https://docs.squiz.net/squiz-dxp/latest/)
- [Component Service Documentation](https://docs.squiz.net/component-service/latest/)
- [DXP CLI Documentation](https://docs.squiz.net/squiz-dxp/latest/dxp-cli/)
- [Matrix 6 Documentation](https://docs.squiz.net/matrix/)
- [Visual Page Builder Guide](https://docs.squiz.net/page-builder/latest/)

### Useful Links

- [Semantic Versioning](https://semver.org/)
- [BEM Methodology](http://getbem.com/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

### Support Channels

- Squiz Support Portal
- DXP Community Forums
- Matrix User Documentation
- Internal team knowledge base

---

## Summary

This integration enables a modern component development workflow while leveraging Matrix 6's content management capabilities:

1. **Develop** components locally with hot reload
2. **Build** optimized production assets
3. **Sync** CSS/JS to Matrix via GitBridge
4. **Deploy** component logic to Squiz DXP
5. **Configure** component sets and environment variables
6. **Use** components in Matrix with Visual Page Builder

By following this guide, your team can maintain version-controlled, tested, and deployable components that integrate seamlessly with Squiz Matrix 6's enterprise content management features.

For questions or issues not covered here, consult the official Squiz documentation or contact your Squiz support representative.
