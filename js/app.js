
/**
 * LexBridge — Application Entry Point
 * Version: 0.2.0
 *
 * Professional workspace integration.
 *
 * Features:
 * - Dashboard and sidebar navigation
 * - Corporate module integration
 * - Existing workflow and document support
 * - Centralized status and error reporting
 * - Legacy interface fallback
 *
 * Framework-free ES modules.
 * Compatible with GitHub Pages.
 */

"use strict";

// ---------------------------------------------
// APPLICATION METADATA
// ---------------------------------------------

const APP = Object.freeze({
  name: "LexBridge",
  version: "0.2.0",
  jurisdiction: "CH",
  environment: "development"
});

// ---------------------------------------------
// EXISTING HTML REFERENCES
// ---------------------------------------------

const statusElement =
  document.getElementById("app-status");

const legacyModuleContainer =
  document.getElementById("module-container");

const legacyMain =
  document.querySelector("main.app-shell");

const legacyHeader =
  document.querySelector("header.site-header");

// The active module mounting point.
let activeModuleContainer =
  legacyModuleContainer;

// Store the new workspace controller.
let appShell = null;

// ---------------------------------------------
// ERROR REPORTING
// ---------------------------------------------

function reportError(
  error,
  context = "Application"
) {
  const message = error instanceof Error
    ? error.message
    : String(error);

  console.error(
    `[LexBridge: ${context}]`,
    error
  );

  if (
    typeof window.LexBridgeReportError ===
    "function"
  ) {
    window.LexBridgeReportError(
      `${context}: ${message}`
    );
  }
}

// ---------------------------------------------
// APPLICATION STATUS
// ---------------------------------------------

function setStatus(
  message,
  state = "info"
) {
  if (!statusElement) {
    console.warn(
      "App status element is missing."
    );
    return;
  }

  statusElement.textContent = message;
  statusElement.dataset.state = state;

  const colors = {
    success: "#176b55",
    error: "#a52727",
    warning: "#996700",
    info: "#687587"
  };

  statusElement.style.color =
    colors[state] || colors.info;
}

// ---------------------------------------------
// BASIC DOM HELPERS
// ---------------------------------------------

function createElement(
  tag,
  options = {}
) {
  const element =
    document.createElement(tag);

  if (options.className) {
    element.className =
      options.className;
  }

  if (options.text !== undefined) {
    element.textContent =
      String(options.text);
  }

  return element;
}

function showPlaceholder(
  title,
  description
) {
  if (!activeModuleContainer) {
    throw new Error(
      "Module container is missing."
    );
  }

  const card = createElement(
    "section",
    { className: "card" }
  );

  card.style.marginTop = "24px";

  const heading = createElement(
    "h3",
    { text: title }
  );

  const paragraph = createElement(
    "p",
    { text: description }
  );

  paragraph.className =
    "card-description";

  card.append(
    heading,
    paragraph
  );

  activeModuleContainer.replaceChildren(
    card
  );

  // Make errors visible inside Corporate.
  if (appShell) {
    appShell.showCorporate();
  }
}

// ---------------------------------------------
// NEW WORKSPACE INITIALIZATION
// ---------------------------------------------

async function initializeWorkspace() {
  /*
   * Load the workspace separately.
   *
   * If it fails, the original HTML remains
   * available as a fallback interface.
   */

  const { createAppShell } =
    await import(
      "./core/app-shell.js"
    );

  if (
    typeof createAppShell !== "function"
  ) {
    throw new Error(
      "App Shell does not export createAppShell()."
    );
  }

  // Create a full-width mount point outside
  // the old constrained main element.
  const workspaceHost =
    document.createElement("div");

  workspaceHost.id =
    "lexbridge-workspace";

  // Insert before the original application.
  document.body.insertBefore(
    workspaceHost,
    legacyHeader || legacyMain ||
      document.body.firstChild
  );

  let shell;

  try {
    shell = createAppShell(
      workspaceHost
    );

    if (
      !shell ||
      !(shell.moduleContainer instanceof HTMLElement)
    ) {
      throw new Error(
        "App Shell returned an invalid module container."
      );
    }

  } catch (error) {
    workspaceHost.remove();
    throw error;
  }

  // Activate the new module mounting point.
  activeModuleContainer =
    shell.moduleContainer;

  appShell = shell;

  // Move the existing status element into
  // the new workspace rather than cloning it.
  // This preserves its ID and references.
  if (statusElement) {
    activeModuleContainer.before(
      statusElement
    );
  }

  // Hide, rather than delete, old application
  // markup so it remains available if needed.
  if (legacyHeader) {
    legacyHeader.hidden = true;
  }

  if (legacyMain) {
    legacyMain.hidden = true;
  }

  // Dashboard is the default page.
  shell.navigate("dashboard");

  console.info(
    "LexBridge workspace initialized."
  );

  return shell;
}

// ---------------------------------------------
// SHARED APPLICATION CONTEXT
// ---------------------------------------------

function createContext() {
  return Object.freeze({
    app: APP,
    container: activeModuleContainer,
    setStatus,
    reportError,
    createElement
  });
}

// ---------------------------------------------
// MODULE LOADING
// ---------------------------------------------

async function loadModules() {
  setStatus(
    "Loading application modules...",
    "info"
  );

  try {
    const moduleSystem =
      await import(
        "./core/module-loader.js"
      );

    if (
      typeof moduleSystem.initializeModules !==
      "function"
    ) {
      throw new Error(
        "Module loader does not export initializeModules()."
      );
    }

    // Important: pass the NEW module container.
    await moduleSystem.initializeModules(
      createContext()
    );

    setStatus(
      "LexBridge initialized successfully.",
      "success"
    );

    console.info(
      "LexBridge modules initialized."
    );

  } catch (error) {
    setStatus(
      "Application initialization failed.",
      "error"
    );

    reportError(
      error,
      "Module initialization"
    );

    showPlaceholder(
      "Unable to load application modules",
      "The requested module could not be loaded. " +
      "Check the LexBridge Error Monitor."
    );
  }
}

// ---------------------------------------------
// APPLICATION BOOTSTRAP
// ---------------------------------------------

async function startApplication() {
  try {
    if (
      !statusElement ||
      !legacyModuleContainer
    ) {
      throw new Error(
        "Required application elements " +
        "are missing from index.html."
      );
    }

    setStatus(
      "Starting LexBridge...",
      "info"
    );

    console.info(
      `${APP.name} v${APP.version} starting`
    );

    // First initialize the new interface.
    try {
      await initializeWorkspace();

    } catch (error) {
      reportError(
        error,
        "Workspace initialization"
      );

      // Keep the old interface visible
      // if the new shell cannot load.
      activeModuleContainer =
        legacyModuleContainer;

      appShell = null;

      // Restore the existing status element.
      if (legacyMain && statusElement) {
        const welcome =
          legacyMain.querySelector(
            ".welcome-panel"
          );

        if (welcome) {
          welcome.appendChild(
            statusElement
          );
        }
      }

      if (legacyHeader) {
        legacyHeader.hidden = false;
      }

      if (legacyMain) {
        legacyMain.hidden = false;
      }

      setStatus(
        "Workspace unavailable. " +
        "Using the original interface.",
        "warning"
      );
    }

    // Load the existing legal modules.
    // No change to legal or document engines.
    await loadModules();

  } catch (error) {
    setStatus(
      "Application startup failed.",
      "error"
    );

    reportError(
      error,
      "Startup"
    );
  }
}

// ---------------------------------------------
// START APPLICATION
// ---------------------------------------------

startApplication();
