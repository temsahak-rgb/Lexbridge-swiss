
/**
 * LexBridge Swiss Corporate
 * Application Entry Point
 * Version: 0.1.0
 *
 * Framework-free ES module.
 * No React, npm, or build tools required.
 */

"use strict";

// --------------------------------------------------
// APPLICATION METADATA
// --------------------------------------------------

const APP = Object.freeze({
  name: "LexBridge",
  version: "0.1.0",
  jurisdiction: "CH",
  environment: "development"
});

// --------------------------------------------------
// DOM REFERENCES
// --------------------------------------------------

const statusElement =
  document.getElementById("app-status");

const moduleContainer =
  document.getElementById("module-container");

// --------------------------------------------------
// ERROR REPORTING
// --------------------------------------------------

function reportError(error, context = "Application") {
  const message = error instanceof Error
    ? error.message
    : String(error);

  console.error(`[LexBridge: ${context}]`, error);

  if (typeof window.LexBridgeReportError === "function") {
    window.LexBridgeReportError(
      `${context}: ${message}`
    );
  }
}

// --------------------------------------------------
// APPLICATION STATUS
// --------------------------------------------------

function setStatus(message, state = "info") {
  if (!statusElement) {
    console.warn("App status element is missing.");
    return;
  }

  statusElement.textContent = message;
  statusElement.dataset.state = state;

  if (state === "success") {
    statusElement.style.color = "#176b55";
  } else if (state === "error") {
    statusElement.style.color = "#a52727";
  } else {
    statusElement.style.color = "#687587";
  }
}

// --------------------------------------------------
// BASIC RENDERING HELPERS
// --------------------------------------------------

function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text !== undefined) {
    element.textContent = String(options.text);
  }

  return element;
}

function showPlaceholder(title, description) {
  if (!moduleContainer) {
    throw new Error("Module container is missing.");
  }

  const card = createElement("section", {
    className: "card"
  });

  card.style.marginTop = "24px";

  const heading = createElement("h3", {
    text: title
  });

  const paragraph = createElement("p", {
    text: description
  });

  paragraph.className = "card-description";

  card.append(heading, paragraph);

  moduleContainer.replaceChildren(card);
}

// --------------------------------------------------
// SHARED APPLICATION CONTEXT
// --------------------------------------------------

const context = Object.freeze({
  app: APP,
  container: moduleContainer,
  setStatus,
  reportError,
  createElement
});

// --------------------------------------------------
// MODULE SYSTEM
// --------------------------------------------------

async function loadModules() {
  setStatus("Loading application modules...");

  try {
    /*
     * The module loader is a separate file.
     * Keeping it separate makes future expansion easier.
     *
     * Next file:
     * js/core/module-loader.js
     */

    const moduleSystem = await import(
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

    await moduleSystem.initializeModules(context);

    setStatus(
      "LexBridge core initialized successfully.",
      "success"
    );

  } catch (error) {

    // During initial construction, the loader
    // does not exist yet. Treat this as setup,
    // not as a completed installation.

    const missingLoader =
      error instanceof TypeError &&
      /module-loader\.js/.test(error.message);

    if (missingLoader) {
      setStatus(
        "Core ready. Module loader not installed yet.",
        "info"
      );

      showPlaceholder(
        "Core installation completed",
        "The application entry point is ready. " +
        "Next, install js/core/module-loader.js " +
        "to enable independent legal modules."
      );

      return;
    }

    setStatus(
      "Application initialization failed.",
      "error"
    );

    reportError(error, "Module initialization");

    showPlaceholder(
      "Unable to load application modules",
      "Check the LexBridge Error Monitor for details."
    );
  }
}

// --------------------------------------------------
// APPLICATION BOOTSTRAP
// --------------------------------------------------

async function startApplication() {
  try {
    if (!statusElement || !moduleContainer) {
      throw new Error(
        "Required application elements are missing from index.html."
      );
    }

    setStatus("Starting LexBridge...");

    console.info(
      `${APP.name} v${APP.version} starting`
    );

    await loadModules();

  } catch (error) {
    setStatus("Application startup failed.", "error");
    reportError(error, "Startup");
  }
}

// --------------------------------------------------
// START
// --------------------------------------------------

startApplication();
