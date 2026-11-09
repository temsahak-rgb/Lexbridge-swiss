
/**
 * LexBridge — Corporate Document Service
 * Version: 0.1.0
 *
 * Selects approved local templates and generates
 * preliminary corporate document drafts.
 *
 * Compatible with GitHub Pages.
 * No API key, backend or external packages.
 */

"use strict";

import {
  generateDocument,
  documentToText
} from "../../../js/core/document-engine.js";

// ---------------------------------------------
// APPROVED TEMPLATE REGISTRY
// ---------------------------------------------

const TEMPLATE_REGISTRY = Object.freeze({
  "acceptance-fr": {
    path: "./templates/acceptance-fr.json",
    label: "Mandate acceptance — French"
  },
  "acceptance-de": {
    path: "./templates/acceptance-de.json",
    label: "Mandate acceptance — German"
  }
});

// ---------------------------------------------
// SAFE JSON LOADING
// ---------------------------------------------

const templateCache = new Map();

async function loadTemplate(templateId) {
  if (!Object.hasOwn(TEMPLATE_REGISTRY, templateId)) {
    throw new Error(
      "Unsupported document template: " + templateId
    );
  }

  const entry = TEMPLATE_REGISTRY[templateId];

  if (templateCache.has(templateId)) {
    return templateCache.get(templateId);
  }

  const url = new URL(entry.path, import.meta.url);
  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Cannot load document template ${templateId} ` +
      `(HTTP ${response.status}).`
    );
  }

  const template = await response.json();

  if (!template || typeof template !== "object") {
    throw new Error("Invalid document template data.");
  }

  templateCache.set(templateId, template);
  return template;
}

// ---------------------------------------------
// TEMPLATE CATALOG
// ---------------------------------------------

/**
 * Return available document templates.
 * Suitable for a dropdown list in the UI.
 */
export function listDocumentTemplates() {
  return Object.entries(TEMPLATE_REGISTRY).map(
    ([id, entry]) => ({
      id,
      label: entry.label
    })
  );
}

// ---------------------------------------------
// APPLICABILITY VALIDATION
// ---------------------------------------------

function validateApplicability(template, matter) {
  const rules = template.appliesTo;

  if (!rules || typeof rules !== "object") {
    throw new Error(
      "Document template has no applicability rules."
    );
  }

  const checks = [
    ["companyTypes", matter.companyType],
    ["operations", matter.operation],
    ["cantons", matter.canton]
  ];

  for (const [field, value] of checks) {
    const allowed = rules[field];

    if (
      !Array.isArray(allowed) ||
      !allowed.includes(value)
    ) {
      throw new Error(
        `Template is not applicable: ${field} = ${value}`
      );
    }
  }
}

// ---------------------------------------------
// DOCUMENT GENERATION
// ---------------------------------------------

/**
 * Generate a corporate document draft.
 *
 * @param {Object} options
 * @param {string} options.templateId
 * @param {Object} options.matter
 * @param {Object} options.details
 *
 * @returns {Promise<Object>}
 */
export async function createCorporateDocument({
  templateId,
  matter,
  details = {}
}) {
  if (!matter || typeof matter !== "object") {
    throw new Error(
      "Corporate matter information is required."
    );
  }

  if (
    !details ||
    typeof details !== "object" ||
    Array.isArray(details)
  ) {
    throw new Error(
      "Document details must be an object."
    );
  }

  const template = await loadTemplate(templateId);

  validateApplicability(template, matter);

  // Matter identity and legal-form selection must
  // come from the validated workflow, not from
  // optional document details.
  const data = {
    ...details,
    ...matter
  };

  const draft = generateDocument(template, data);

  return {
    ...draft,
    documentType: template.documentType,
    templateId,
    templateStatus: template.status || "unknown",
    reviewRequirements: Array.isArray(
      template.reviewRequirements
    )
      ? [...template.reviewRequirements]
      : [],
    legalNotice: template.legalNotice || draft.disclaimer,
    matterReference: {
      companyName: matter.companyName,
      companyType: matter.companyType,
      canton: matter.canton,
      operation: matter.operation
    }
  };
}

// ---------------------------------------------
// TEXT EXPORT
// ---------------------------------------------

/**
 * Convert the generated draft to plain text.
 * The download button will be added to the UI later.
 */
export function corporateDocumentToText(document) {
  return documentToText(document);
}
