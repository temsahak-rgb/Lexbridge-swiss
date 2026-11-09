
/**
 * LexBridge — Generic Document Engine
 * Version: 0.1.0
 *
 * Template-based document generation.
 *
 * No AI, no external dependencies.
 * No DOM or network access.
 *
 * Compatible with GitHub Pages and ES modules.
 */

"use strict";

// ------------------------------------------
// UTILITIES
// ------------------------------------------

function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function unique(values) {
  return [...new Set(values)];
}

/**
 * Allowed placeholder syntax:
 * {{companyName}}
 * {{personName}}
 * {{company.address}}
 *
 * No JavaScript expressions or function calls.
 */
const PLACEHOLDER =
  /\{\{\s*([a-zA-Z][a-zA-Z0-9_.]*)\s*\}\}/g;

function findPlaceholders(text) {
  if (typeof text !== "string") {
    return [];
  }

  return unique(
    [...text.matchAll(PLACEHOLDER)].map(
      (match) => match[1]
    )
  );
}

/**
 * Safely retrieve a value from structured data.
 * Prototype properties are not permitted.
 */
function getValue(data, path) {
  const parts = path.split(".");
  let current = data;

  for (const part of parts) {
    if (
      part === "__proto__" ||
      part === "prototype" ||
      part === "constructor"
    ) {
      return undefined;
    }

    if (
      !isObject(current) ||
      !Object.hasOwn(current, part)
    ) {
      return undefined;
    }

    current = current[part];
  }

  if (
    current === undefined ||
    current === null ||
    typeof current === "object"
  ) {
    return undefined;
  }

  return String(current);
}

function hasValue(value) {
  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  );
}

// ------------------------------------------
// TEMPLATE VALIDATION
// ------------------------------------------

export function validateTemplate(template) {
  if (!isObject(template)) {
    throw new Error(
      "Document template must be an object."
    );
  }

  if (
    typeof template.id !== "string" ||
    !template.id.trim()
  ) {
    throw new Error(
      "Document template requires an ID."
    );
  }

  if (
    typeof template.title !== "string" ||
    !template.title.trim()
  ) {
    throw new Error(
      "Document template requires a title."
    );
  }

  if (
    typeof template.content !== "string" ||
    !template.content.trim()
  ) {
    throw new Error(
      "Document template requires content."
    );
  }

  if (
    !Array.isArray(template.requiredFields) ||
    !template.requiredFields.every(
      (field) => typeof field === "string"
    )
  ) {
    throw new Error(
      "Document template requires a valid requiredFields array."
    );
  }

  if (
    template.language !== undefined &&
    !["en", "fr", "de"].includes(template.language)
  ) {
    throw new Error(
      "Unsupported document language."
    );
  }

  const required = new Set(template.requiredFields);
  const placeholders = findPlaceholders(
    template.title + "\n" + template.content
  );

  // Every referenced value must be declared.
  const undeclared = placeholders.filter(
    (field) => !required.has(field)
  );

  if (undeclared.length > 0) {
    throw new Error(
      "Undeclared template fields: " +
      undeclared.join(", ")
    );
  }

  return true;
}

// ------------------------------------------
// DOCUMENT GENERATION
// ------------------------------------------

function replacePlaceholders(text, data) {
  return text.replace(
    PLACEHOLDER,
    (match, field) => {
      const value = getValue(data, field);

      // Missing information remains visible.
      return hasValue(value)
        ? value
        : "[MISSING: " + field + "]";
    }
  );
}

/**
 * Generate a draft from a JSON template.
 *
 * The result is plain text, not HTML.
 *
 * @param {Object} template
 * @param {Object} data
 * @returns {Object}
 */
export function generateDocument(template, data) {
  validateTemplate(template);

  if (!isObject(data)) {
    throw new Error(
      "Document generation requires structured data."
    );
  }

  const missingFields = unique(
    template.requiredFields.filter(
      (field) => !hasValue(getValue(data, field))
    )
  );

  const document = {
    id: template.id,
    title: replacePlaceholders(
      template.title,
      data
    ),
    language: template.language || "en",
    jurisdiction: template.jurisdiction || null,
    generatedAt: new Date().toISOString(),

    status: missingFields.length
      ? "incomplete"
      : "draft",

    content: replacePlaceholders(
      template.content,
      data
    ),

    missingFields,

    templateVersion:
      template.version || "unspecified",

    sourceIds: Array.isArray(template.sourceIds)
      ? [...template.sourceIds]
      : [],

    review: {
      required: true,
      approved: false,
      reviewedBy: null,
      reviewedAt: null
    },

    disclaimer:
      "Automatically prepared draft. " +
      "No legal validity or filing readiness " +
      "is implied. Human review is required."
  };

  return document;
}

// ------------------------------------------
// DOCUMENT EXPORT
// ------------------------------------------

/**
 * Convert a document to plain text.
 *
 * This function does not download a file.
 * The UI or export service handles that.
 */
export function documentToText(document) {
  if (
    !isObject(document) ||
    typeof document.content !== "string"
  ) {
    throw new Error(
      "Invalid document for text export."
    );
  }

  return [
    document.title || "Untitled document",
    "",
    "STATUS: " + (document.status || "draft"),
    "",
    document.content,
    "",
    "---",
    document.disclaimer || ""
  ].join("\n");
}

/**
 * Return a summary for a report.
 */
export function summarizeDocument(document) {
  if (!isObject(document)) {
    throw new Error("Invalid document.");
  }

  return {
    id: document.id,
    title: document.title,
    language: document.language,
    status: document.status,
    missingFields: [
      ...(document.missingFields || [])
    ],
    requiresHumanReview: true
  };
}
