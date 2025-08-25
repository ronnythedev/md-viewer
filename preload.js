const { contextBridge, ipcRenderer } = require("electron");
const marked = require("marked");
const hljs = require("highlight.js");

marked.setOptions({
  highlight: (code, lang) => {
    if (hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    } else {
      return hljs.highlightAuto(code).value;
    }
  },
});

contextBridge.exposeInMainWorld("api", {
  renderMarkdown: (content) => {
    if (typeof marked.parse === "function") {
      return marked.parse(content);
    } else {
      throw new Error("marked.parse is not available or is not a function");
    }
  },
  highlightCode: () => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  },
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  readFiles: (folderPath) => ipcRenderer.invoke("read-files", folderPath),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  setOpacity: (opacity) => ipcRenderer.send("set-opacity", opacity),
  closeApp: () => ipcRenderer.send("close-app"),
});
