# MD Viewer

MD Viewer is an Electron-based application designed to browse, view, and interact with Markdown (.md) files, making it especially useful for organizing and referencing solutions or code snippets.

## Features

- **Dynamic Markdown Rendering**: View and interact with `.md` files in a clean, responsive interface.
- **Code Syntax Highlighting**: Includes support for light and dark themes with syntax highlighting for programming languages.
- **Zoom Functionality**: Zoom in, zoom out, or reset the view for better readability.
- **File Filtering**: Quickly search through loaded Markdown files using a filter input.
- **Resizable Panels**: Adjust the width of the file list panel to your preference.
- **Opacity Adjustment**: Make the app semi-transparent to view other windows in the background.
- **Cross-Platform**: Works on macOS, Windows, and Linux.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or later)
- npm (comes with Node.js)

### Installing Dependencies

Clone the repository and navigate into the project directory:

```bash
git clone https://github.com/ronnythedev/md-viewer.git
cd md-viewer
```

Install the required dependencies:

```bash
npm install
```

### Running the App

To start the app in development mode:

```bash
npm start
```

---

## Building the App

To create an executable for macOS, Windows, or Linux, use **Electron Packager**.

### Build Command (macOS Example)

Run the following command to build the app:

```bash
npm run package
```

This will generate a `.app` file (for macOS) in the `release-build` folder.

### Build Configuration

The `package.json` file contains the packaging script:

```json
"scripts": {
  "start": "electron .",
  "package": "electron-packager . MarkdownViewer --overwrite --platform=darwin --arch=arm64 --prune=true --out=release-build --icon=icon.icns"
}
```

Modify the `--platform` option to target specific platforms:

- `darwin`: macOS
- `win32`: Windows
- `linux`: Linux

Modify the `--arch` option to target specific architectures:

- `x64`: 64-bit systems
- `arm64`: ARM-based systems (e.g., Apple Silicon)

---

## Folder Structure

```
project-directory/
├── release-build/           # Contains built executables (after packaging)
├── styles/                  # CSS files for themes
│   ├── github-dark.css
│   ├── github.css
├── node_modules/            # Installed dependencies
├── index.html               # Main HTML file
├── main.js                  # Electron's main process file
├── preload.js               # Preload script for exposing APIs to renderer
├── renderer.js              # Renderer process logic
├── package.json             # Project configuration and dependencies
├── README.md                # Project documentation (this file)
```

---

## Usage

1. **Open Folder**: Click the "Open Folder" button to load `.md` files from a directory.
2. **Filter Files**: Use the filter input to search through file names.
3. **Theme Toggle**: Click the 🌙 or ☀️ button to switch between dark and light themes.
4. **Zoom Controls**: Use the `+`, `-`, or `Reset` buttons to zoom in, zoom out, or reset the view.
5. **Adjust Opacity**: Drag the slider to make the app transparent.
6. **Resizable Panels**: Drag the right edge of the file list panel to resize it.

---

## Technologies Used

- **Electron**: Cross-platform desktop application framework.
- **Marked**: For parsing and rendering Markdown content.
- **Highlight.js**: For syntax highlighting.
- **Node.js**: Backend for Electron.

---

## Future Improvements

- Load Markdown files from the Internet.
- Add drag-and-drop support for loading Markdown files.
- Create an installer for easier distribution.
- Add the ability to edit and save Markdown files directly in the app.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
