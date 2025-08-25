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
let isClickThroughEnabled = true; // Track click-through state

// Set up click-through behavior
document.addEventListener("DOMContentLoaded", () => {
  // Define interactive areas (areas that should capture mouse events)
  const interactiveAreas = [
    document.getElementById("controls"),
    document.getElementById("fileListContainer"),
  ];

  // Function to update click-through behavior
  function updateClickThrough() {
    if (!isClickThroughEnabled) {
      // When click-through is disabled, always allow mouse events
      window.api.setIgnoreMouseEvents(false);
      return;
    }

    // Original click-through logic when enabled
    document.addEventListener("mousemove", handleMouseMove);
  }

  // Track mouse position and determine if it's over an interactive area
  function handleMouseMove(e) {
    if (!isClickThroughEnabled) return;

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
  }

  // Helper function to check if mouse is over an element
  function isElementUnderMouse(element, mouseX, mouseY) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      mouseX >= rect.left &&
      mouseX <= rect.right &&
      mouseY >= rect.top &&
      mouseY <= rect.bottom
    );
  }

  // Initialize click-through behavior
  updateClickThrough();

  // Listen for opacity changes from main process (keyboard shortcuts)
  window.api.onOpacityChanged((newOpacity) => {
    opacitySlider.value = newOpacity;
  });

  // Listen for theme toggle from main process (keyboard shortcuts)
  window.api.onToggleTheme(() => {
    toggleTheme();
  });

  // Listen for click-through toggle from main process
  window.api.onToggleClickThrough(() => {
    toggleClickThrough();
  });

  // Listen for zoom shortcuts from main process
  window.api.onZoomIn(() => {
    zoomIn();
  });

  window.api.onZoomOut(() => {
    zoomOut();
  });
});

// Function to toggle click-through functionality
function toggleClickThrough() {
  isClickThroughEnabled = !isClickThroughEnabled;

  if (isClickThroughEnabled) {
    // Re-enable the original mousemove listener for dynamic click-through
    document.addEventListener("mousemove", (e) => {
      let isOverInteractive = false;

      // Check if mouse is over the title bar area (top 30px of window)
      if (e.clientY <= 30) {
        isOverInteractive = true;
      } else {
        // Check other interactive areas
        const interactiveAreas = [
          document.getElementById("controls"),
          document.getElementById("fileListContainer"),
        ];

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
  } else {
    // Disable click-through completely - always allow mouse events
    window.api.setClickThrough(false);
  }

  // Helper function for the new listener
  function isElementUnderMouse(element, mouseX, mouseY) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      mouseX >= rect.left &&
      mouseX <= rect.right &&
      mouseY >= rect.top &&
      mouseY <= rect.bottom
    );
  }
}

// Function to apply zoom
function applyZoom() {
  const fontSize = `${zoomLevel * 16}px`; // Base font size is 16px
  contentDiv.style.fontSize = fontSize; // Dynamically adjust font size
}

// NEW FEATURE 2: Zoom functions that can be called from shortcuts
function zoomIn() {
  zoomLevel += 0.1; // Increment zoom level
  applyZoom();
}

function zoomOut() {
  if (zoomLevel > 0.5) {
    // Prevent zooming out too far
    zoomLevel -= 0.1; // Decrement zoom level
    applyZoom();
  }
}

// Zoom in button
zoomInButton.addEventListener("click", zoomIn);

// Zoom out button
zoomOutButton.addEventListener("click", zoomOut);

// Reset zoom
resetZoomButton.addEventListener("click", () => {
  zoomLevel = 1; // Reset to default zoom level
  applyZoom();
});

// Function to switch themes (shared by button and keyboard shortcut)
function toggleTheme() {
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
}

// Function to switch themes
toggleThemeButton.addEventListener("click", toggleTheme);

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
