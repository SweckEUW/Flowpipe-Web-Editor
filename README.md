# Flowpipe Web Editor

![Flowpipe Web Editor](docs/img/flowpipe-editor.png)

A browser-based visual pipeline editor for [Flowpipe](https://github.com/PaulSchweizer/flowpipe). Build, inspect, and run data pipelines by connecting nodes on a canvas. The editor communicates with a local Flowpipe backend for pipeline execution.

Built with **Vue 3**, **TypeScript**, **Baklava.js**, and **Vite**.

---

## Features

- Visual node-graph canvas for composing pipelines
- Multi-tab support — work on several graphs simultaneously
- Load and save pipelines as JSON
- Right-hand sidebar for inspecting and editing node properties
- Node search dialog (press `Tab`) to quickly insert nodes
- One-click pipeline execution via a connected backend

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| [Node.js](https://nodejs.org) | 18 |
| npm | 9 |
| Flowpipe backend | running on `http://localhost:8000` |

The Flowpipe backend is only required for executing pipelines. The editor itself loads and runs without it.

---

## Installation

**1. Clone the repository**

```sh
git clone https://github.com/sweckeuw/Flowpipe-Web-Editor.git
cd flowpipe-web-editor
```

**2. Install dependencies**

```sh
npm install
```

**3. Start the development server**

```sh
npm run dev
```

The app is available at `http://localhost:5173`. The dev server automatically proxies `/api` requests to `http://localhost:8000`, so the Flowpipe backend just needs to be running — no extra configuration needed.

---

## Usage

### Canvas navigation

| Action | Input |
|--------|-------|
| Pan | Middle mouse button drag — or right mouse button drag on empty canvas |
| Zoom | Mouse wheel |
| Fit all nodes into view | `F` |

### Adding and managing nodes

| Action | Input |
|--------|-------|
| Open node search | `Tab` |
| Add node | Search dialog → click node name |
| Move node | Left click + drag on node |
| Delete selected nodes | `Delete` |
| Node context menu (rename / delete) | Right-click on node |

### Selecting nodes

| Action | Input |
|--------|-------|
| Select single node | Left click |
| Add to selection | `Ctrl` + click |
| Draw selection box | `B`, then click + drag on empty canvas |

### Connections

| Action | Input |
|--------|-------|
| Connect two nodes | Drag from an output port (right side) to an input port (left side) |
| Remove a connection | Right-click on the connection line |

### Edit history

| Action | Input |
|--------|-------|
| Undo | `Ctrl + Z` |
| Redo | `Ctrl + Y` |
| Copy selected nodes | `Ctrl + C` |
| Paste nodes | `Ctrl + V` |

### Toolbar (top bar)

| Button | Action |
|--------|--------|
| Load | Open a `.json` file to restore a saved pipeline |
| Save | Export the current graph as a `.json` file |
| Run | Execute the pipeline via the connected Flowpipe backend |

### Tabs

| Action | Input |
|--------|-------|
| New tab | Click `+` in the tab bar |
| Switch tab | Click on tab |
| Rename tab | Double-click on tab name, confirm with `Enter`, cancel with `Escape` |
| Close tab | Click `×` on tab |

---

## Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-module reload |
| `npm run build` | Type-check and build the npm package to `dist/` |

---

## Demo page

A demo of the editor is deployed to GitHub Pages: [https://sweckeuw.github.io/Flowpipe-Web-Editor/](https://sweckeuw.github.io/Flowpipe-Web-Editor/)

The demo in [`demo/`](demo/) is a standalone Vite project that uses the editor exactly like an external app would: it installs the **published npm package** (`flowpipe-web-editor@latest`, no lockfile) and embeds the `<flowpipe-editor>` custom element. It does not import anything from `src/`.

The nodes it offers are defined manually in [`demo/main.ts`](demo/main.ts) as `SerializedFlowpipeNode[]`. The default `value` of an input decides its widget: boolean → checkbox, number → number field, string or `null` → text field.

Run it locally (requires the package to be published):

```sh
cd demo
npm install
npm run dev
```

The workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs after every **Publish to npm** run on `main`, waits until the new version is available on npm, builds the demo and deploys it.

**Setup (one time):** In the GitHub repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.

For manual runs: **Actions → Deploy demo to GitHub Pages → Run workflow**.

---

## Publishing to npm

The GitHub Actions workflow [`.github/workflows/publish.yml`](.github/workflows/publish.yml) builds the package and publishes it to the npm registry on every push to `main` — but only if the version in `package.json` is not yet published. Pushes without a version bump are skipped (the run stays green).

**Setup (one time):**

1. On [npmjs.com](https://www.npmjs.com) create a **Granular Access Token** with *Read and write* permission for packages (allowed to bypass 2FA for publishing).
2. In the GitHub repository go to **Settings → Secrets and variables → Actions** and add it as secret `NPM_TOKEN`.

**Releasing a new version:**

```sh
npm version patch --no-git-tag-version   # or minor / major
git commit -am "release vX.Y.Z"
git push                                 # on main
```

The workflow publishes the package and tags the commit with `vX.Y.Z`.

For manual runs: **Actions → Publish to npm → Run workflow**.
