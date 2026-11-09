
/**
 * LexBridge — Module Loader
 * Version: 0.1.0
 *
 * Loads independently developed application modules.
 * Framework-free, GitHub Pages compatible.
 */

"use strict";

// Approved modules and their code locations.
// Never import executable code directly from JSON URLs.
const MODULE_REGISTRY = Object.freeze({
  corporate: {
    name: "Corporate Governance",
    path: "../../modules/corporate/index.js"
  }

  // Future modules can be registered here:
  // compliance: {
  //   name: "Compliance",
  //   path: "../../modules/compliance/index.js"
  // }
});

/**
 * Load and validate the application module manifest.
 */
async function getModuleManifest() {
  const url = new URL(
    "../../modules/modules.json",
    import.meta.url
  );

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Cannot load module manifest (HTTP ${response.status}).`
    );
  }

  const manifest = await response.json();

  if (
    !manifest ||
    !Array.isArray(manifest.modules)
  ) {
    throw new Error(
      "Invalid module manifest: modules must be an array."
    );
  }

  return manifest;
}

/**
 * Create an accessible fallback message.
 */
function showMessage(container, title, description) {
  const section = document.createElement("section");
  section.className = "card";
  section.style.marginTop = "24px";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.className = "card-description";
  paragraph.textContent = description;

  section.append(heading, paragraph);
  container.appendChild(section);
}

/**
 * Initialise the active modules.
 *
 * Each module exports:
 *   async function mount(context, element)
 */
export async function initializeModules(context) {
  const { container, reportError, setStatus } = context;

  if (!container) {
    throw new Error("Module container is missing.");
  }

  container.replaceChildren();

  setStatus("Reading enabled modules...");

  let manifest;

  try {
    manifest = await getModuleManifest();
  } catch (error) {
    reportError(error, "Module manifest");

    showMessage(
      container,
      "Module configuration unavailable",
      "The modules/modules.json file could not be loaded."
    );

    throw error;
  }

  const enabledModules = manifest.modules.filter(
    (module) => module.enabled === true
  );

  if (enabledModules.length === 0) {
    showMessage(
      container,
      "No active modules",
      "Enable a module in modules/modules.json."
    );
    return;
  }

  const loaded = new Set();

  for (const moduleConfig of enabledModules) {
    const id = moduleConfig.id;

    // Validate identity and avoid duplicated modules.
    if (
      typeof id !== "string" ||
      !Object.hasOwn(MODULE_REGISTRY, id) ||
      loaded.has(id)
    ) {
      reportError(
        new Error(`Unknown or duplicate module: ${String(id)}`),
        "Module registry"
      );
      continue;
    }

    loaded.add(id);

    const registeredModule = MODULE_REGISTRY[id];

    setStatus(`Loading ${registeredModule.name}...`);

    const moduleElement = document.createElement("section");
    moduleElement.className = "lexbridge-module";
    moduleElement.dataset.module = id;

    container.appendChild(moduleElement);

    try {
      const moduleURL = new URL(
        registeredModule.path,
        import.meta.url
      );

      const implementation = await import(
        moduleURL.href
      );

      if (typeof implementation.mount !== "function") {
        throw new Error(
          `Module ${id} does not export mount().`
        );
      }

      await implementation.mount(
        context,
        moduleElement
      );

      console.info(
        `[LexBridge] Module loaded: ${registeredModule.name}`
      );

    } catch (error) {
      reportError(error, `Module ${id}`);

      showMessage(
        moduleElement,
        "Module unavailable",
        `Could not initialize ${registeredModule.name}.`
      );
    }
  }
}
