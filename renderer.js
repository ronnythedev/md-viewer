const fileListContainer = document.getElementById("fileListContainer");
const toggleFileListButton = document.getElementById("toggleFileList");
const fileListContent = document.getElementById("fileListContent");
const contentDiv = document.getElementById("content");
const openFolderButton = document.getElementById("openFolder");
const opacitySlider = document.getElementById("opacitySlider");
const toggleThemeButton = document.getElementById("toggleTheme");
const zoomInButton = document.getElementById("zoomIn");
const zoomOutButton = document.getElementById("zoomOut");
const resetZoomButton = document.getElementById("resetZoom");
const closeAppButton = document.getElementById("closeApp");

let zoomLevel = 1;
let isDarkTheme = true;
let isCollapsed = false;
let currentFolderPath = "";
let allFiles = [];

// Set up click-through behavior
document.addEventListener("DOMContentLoaded", () => {
  // Define interactive areas (areas that should capture mouse events)
  const interactiveAreas = [
    document.getElementById("controls"),
    document.getElementById("fileListContainer"),
  ];

  // Track mouse position and determine if it's over an interactive area
  document.addEventListener("mousemove", (e) => {
    let isOverInteractive = false;

    // Check if mouse is over the title bar area (top 30px of window)
    if (e.clientY <= 30) {
      isOverInteractive = true;
    } else {
      // Check other interactive areas
      for (const area of interactiveAreas) {
        if (area && isElementUnderMouse(area, e.clientX, e.clientY)) {
          isOverInteractive = true;
          break;
        }
      }
    }

    // Enable mouse events when over interactive areas, disable otherwise
    window.api.setIgnoreMouseEvents(!isOverInteractive, { forward: true });
  });

  // Special handling for filter input - ensure it stays interactive when focused
  const filterInput = document.getElementById("filterInput");

  filterInput.addEventListener("focus", () => {
    // When filter input gets focus, make sure mouse events are enabled
    window.api.setIgnoreMouseEvents(false, { forward: true });
  });

  filterInput.addEventListener("blur", () => {
    // When filter input loses focus, resume normal click-through behavior
    // But only if mouse is not over an interactive area
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: window.lastMouseX || 0,
      clientY: window.lastMouseY || 0,
    });
    document.dispatchEvent(mouseEvent);
  });

  // Track last mouse position for blur event
  document.addEventListener("mousemove", (e) => {
    window.lastMouseX = e.clientX;
    window.lastMouseY = e.clientY;
  });

  // Helper function to check if mouse is over an element
  function isElementUnderMouse(element, mouseX, mouseY) {
    const rect = element.getBoundingClientRect();
    return (
      mouseX >= rect.left &&
      mouseX <= rect.right &&
      mouseY >= rect.top &&
      mouseY <= rect.bottom
    );
  }

  // Listen for opacity changes from main process (keyboard shortcuts)
  window.api.onOpacityChanged((newOpacity) => {
    opacitySlider.value = newOpacity;
  });
});

// Function to apply zoom
function applyZoom() {
  const fontSize = `${zoomLevel * 16}px`; // Base font size is 16px
  contentDiv.style.fontSize = fontSize; // Dynamically adjust font size
}

// Zoom in
zoomInButton.addEventListener("click", () => {
  zoomLevel += 0.1; // Increment zoom level
  applyZoom();
});

// Zoom out
zoomOutButton.addEventListener("click", () => {
  if (zoomLevel > 0.5) {
    // Prevent zooming out too far
    zoomLevel -= 0.1; // Decrement zoom level
    applyZoom();
  }
});

// Reset zoom
resetZoomButton.addEventListener("click", () => {
  zoomLevel = 1; // Reset to default zoom level
  applyZoom();
});

// Function to switch themes
toggleThemeButton.addEventListener("click", () => {
  const themeLink = document.querySelector('link[rel="stylesheet"]');

  if (isDarkTheme) {
    themeLink.href = "./styles/github.css";
    toggleThemeButton.textContent = "☀️";
    isDarkTheme = false;
  } else {
    themeLink.href = "./styles/github-dark.css";
    toggleThemeButton.textContent = "🌙";
    isDarkTheme = true;
  }
});

// Handle close application
closeAppButton.addEventListener("click", () => {
  window.api.closeApp();
});

// Handle collapse/expand
toggleFileListButton.addEventListener("click", () => {
  if (isCollapsed) {
    fileListContainer.style.width = "30%";
    toggleFileListButton.textContent = "<";
  } else {
    fileListContainer.style.width = "0";
    toggleFileListButton.textContent = ">";
  }
  isCollapsed = !isCollapsed;
});

// Load the files and populate the list
openFolderButton.addEventListener("click", async () => {
  currentFolderPath = await window.api.selectDirectory();
  allFiles = await window.api.readFiles(currentFolderPath);
  displayFiles(allFiles);
});

function displayFiles(files) {
  fileListContent.innerHTML = files.map((file) => `<li>${file}</li>`).join("");
}

// Add event listener to the filter input
const filterInput = document.getElementById("filterInput");
filterInput.addEventListener("input", (e) => {
  const filterText = e.target.value.toLowerCase();
  const filteredFiles = allFiles.filter((file) =>
    file.toLowerCase().includes(filterText)
  );
  displayFiles(filteredFiles);
});

// Handle file click
fileListContent.addEventListener("click", async (e) => {
  if (e.target.tagName === "LI") {
    const filePath = `${currentFolderPath}/${e.target.textContent}`;
    const content = await window.api.readFile(filePath);
    const renderedContent = window.api.renderMarkdown(content);
    contentDiv.innerHTML = renderedContent;
    window.api.highlightCode();
  }
});

// Handle opacity change
opacitySlider.addEventListener("input", (e) => {
  const opacity = parseFloat(e.target.value);
  window.api.setOpacity(opacity); // Use API exposed via preload.js
});
