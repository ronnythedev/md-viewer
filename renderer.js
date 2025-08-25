const fileListContainer = document.getElementById("fileListContainer");
const toggleFileListButton = document.getElementById("toggleFileList");
const fileListContent = document.getElementById("fileListContent");
const contentDiv = document.getElementById("content");
const contentWrapper = document.getElementById("contentWrapper");
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
let isClickThroughEnabled = true; // Track click-through state - TRUE means click-through is ACTIVE

// Set up click-through behavior
document.addEventListener("DOMContentLoaded", () => {
  // Define interactive areas (areas that should capture mouse events when click-through is enabled)
  const interactiveAreas = [
    document.getElementById("controls"),
    document.getElementById("fileListContainer"),
    // NOTE: contentWrapper is NOT in interactive areas when click-through is enabled
  ];

  // Track mouse position and determine if it's over an interactive area
  function handleMouseMove(e) {
    if (!isClickThroughEnabled) {
      // When click-through is DISABLED, make everything interactive
      window.api.setIgnoreMouseEvents(false);
      return;
    }

    // When click-through is ENABLED, only interactive areas should capture mouse
    let isOverInteractive = false;

    // Check if mouse is over the title bar area (top 30px of window)
    if (e.clientY <= 30) {
      isOverInteractive = true;
    } else {
      // Check other interactive areas (controls and file list, but NOT content)
      for (const area of interactiveAreas) {
        if (area && isElementUnderMouse(area, e.clientX, e.clientY)) {
          isOverInteractive = true;
          break;
        }
      }
    }

    // Enable mouse events when over interactive areas, disable otherwise (click-through)
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

  // Set up the mouse move listener
  document.addEventListener("mousemove", handleMouseMove);

  // Initialize the click-through state properly
  initializeClickThrough();

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

// Initialize click-through behavior on app start
function initializeClickThrough() {
  console.log("Initializing click-through: ENABLED by default");

  // Ensure content wrapper starts as click-through
  if (contentWrapper) {
    contentWrapper.style.pointerEvents = "none";
  }

  // Trigger initial mouse move logic to set proper state
  const mouseEvent = new MouseEvent("mousemove", {
    clientX: window.innerWidth / 2,
    clientY: window.innerHeight / 2,
  });
  document.dispatchEvent(mouseEvent);
}

// Function to toggle click-through functionality
function toggleClickThrough() {
  isClickThroughEnabled = !isClickThroughEnabled;

  console.log(
    `Click-through toggled: ${isClickThroughEnabled ? "ENABLED" : "DISABLED"}`
  );

  if (isClickThroughEnabled) {
    // Click-through ENABLED: content area becomes click-through, only UI areas interactive
    console.log("Setting up dynamic click-through behavior");
    // Ensure content wrapper is click-through
    if (contentWrapper) {
      contentWrapper.style.pointerEvents = "none";
    }
    // The mousemove handler will manage this dynamically
  } else {
    // Click-through DISABLED: entire window becomes interactive
    console.log("Disabling click-through - all areas interactive");
    window.api.setIgnoreMouseEvents(false);
    // Make content wrapper interactive for scrolling
    if (contentWrapper) {
      contentWrapper.style.pointerEvents = "auto";
    }
  }

  // Show visual feedback
  showClickThroughStatus();
}

// Function to show click-through status
function showClickThroughStatus() {
  let statusIndicator = document.getElementById("clickThroughStatus");

  // Create status indicator if it doesn't exist
  if (!statusIndicator) {
    statusIndicator = document.createElement("div");
    statusIndicator.id = "clickThroughStatus";
    statusIndicator.style.cssText = `
      position: fixed;
      top: 80px;
      right: 10px;
      background: ${
        isClickThroughEnabled
          ? "rgba(255, 165, 0, 0.8)"
          : "rgba(34, 139, 34, 0.8)"
      };
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      pointer-events: none;
      z-index: 1001;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(statusIndicator);
  }

  // Update status
  statusIndicator.style.background = isClickThroughEnabled
    ? "rgba(255, 165, 0, 0.8)"
    : "rgba(34, 139, 34, 0.8)";
  statusIndicator.textContent = isClickThroughEnabled
    ? "Click-Through: ON"
    : "Click-Through: OFF";
  statusIndicator.style.opacity = "1";

  // Hide indicator after 3 seconds
  clearTimeout(statusIndicator.hideTimeout);
  statusIndicator.hideTimeout = setTimeout(() => {
    statusIndicator.style.opacity = "0";
  }, 3000);
}

// Function to apply zoom - robust solution for large content
function applyZoom() {
  const scaleValue = zoomLevel;

  // Clear previous styles
  contentDiv.style.transform = "";
  contentDiv.style.zoom = "";
  contentDiv.style.fontSize = "";

  // Use the most compatible zoom method
  // CSS zoom property works better with scrolling than transform
  if (CSS.supports("zoom", scaleValue.toString())) {
    // Modern browsers support CSS zoom
    contentDiv.style.zoom = scaleValue;
  } else {
    // Fallback: use font-size scaling which is more reliable for text content
    const baseFontSize = 16; // Base font size in pixels
    const scaledFontSize = baseFontSize * scaleValue;
    contentDiv.style.fontSize = `${scaledFontSize}px`;

    // Also scale other elements proportionally
    const style = document.createElement("style");
    style.id = "zoom-style";

    // Remove existing zoom style if present
    const existingStyle = document.getElementById("zoom-style");
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add proportional scaling for various elements
    style.textContent = `
      #content h1 { font-size: ${1.5 * scaleValue}em !important; }
      #content h2 { font-size: ${1.3 * scaleValue}em !important; }
      #content h3 { font-size: ${1.1 * scaleValue}em !important; }
      #content pre { font-size: ${0.9 * scaleValue}em !important; }
      #content code { font-size: ${0.9 * scaleValue}em !important; }
      #content img { transform: scale(${scaleValue}) !important; transform-origin: top left !important; }
    `;
    document.head.appendChild(style);
  }

  // Ensure wrapper handles overflow properly
  if (contentWrapper) {
    contentWrapper.style.overflow = "auto";
    contentWrapper.scrollTop = 0; // Reset scroll position on zoom change
    contentWrapper.scrollLeft = 0;
  }

  // Add visual feedback
  updateZoomIndicator();
}

// Function to show zoom level indicator
function updateZoomIndicator() {
  let zoomIndicator = document.getElementById("zoomIndicator");

  // Create zoom indicator if it doesn't exist
  if (!zoomIndicator) {
    zoomIndicator = document.createElement("div");
    zoomIndicator.id = "zoomIndicator";
    zoomIndicator.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(zoomIndicator);
  }

  // Update and show zoom level
  const zoomPercentage = Math.round(zoomLevel * 100);
  zoomIndicator.textContent = `${zoomPercentage}%`;
  zoomIndicator.style.opacity = "1";

  // Hide indicator after 2 seconds
  clearTimeout(zoomIndicator.hideTimeout);
  zoomIndicator.hideTimeout = setTimeout(() => {
    zoomIndicator.style.opacity = "0";
  }, 2000);
}

// Improved zoom functions with better UX
function zoomIn() {
  const maxZoom = 3.0; // Prevent excessive zoom
  if (zoomLevel < maxZoom) {
    zoomLevel += 0.1;
    zoomLevel = Math.round(zoomLevel * 10) / 10; // Round to 1 decimal place
    applyZoom();
  }
}

function zoomOut() {
  const minZoom = 0.3; // Allow more zoom out
  if (zoomLevel > minZoom) {
    zoomLevel -= 0.1;
    zoomLevel = Math.round(zoomLevel * 10) / 10; // Round to 1 decimal place
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

    // Reapply zoom to the new content
    applyZoom();
  }
});

// Handle opacity change
opacitySlider.addEventListener("input", (e) => {
  const opacity = parseFloat(e.target.value);
  window.api.setOpacity(opacity); // Use API exposed via preload.js
});
