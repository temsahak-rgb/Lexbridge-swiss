
/**
 * LexBridge — Generic Workflow Engine
 * Version: 0.1.0
 *
 * Pure functions, no DOM and no external dependencies.
 * Intended for legal and non-legal workflow modules.
 *
 * IMPORTANT:
 * Data-driven, not AI-powered.
 * Legal rules require separate human verification.
 */

"use strict";

/**
 * Return a unique list while preserving order.
 */
function uniqueStrings(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const normalized = value.trim();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

/**
 * Validate a workflow definition.
 */
function validateDefinition(definition) {
  if (!definition || typeof definition !== "object") {
    throw new Error("Workflow definition is missing.");
  }

  if (
    typeof definition.id !== "string" ||
    !definition.id.trim()
  ) {
    throw new Error("Workflow definition requires an ID.");
  }

  if (!Array.isArray(definition.steps)) {
    throw new Error("Workflow definition requires steps.");
  }

  if (!Array.isArray(definition.sources)) {
    throw new Error("Workflow definition requires sources.");
  }
}

/**
 * Check that required case fields are present.
 */
function findMissingFields(matter, requiredFields) {
  const missing = [];

  for (const field of requiredFields) {
    const value = matter[field];

    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim())
    ) {
      missing.push(field);
    }
  }

  return missing;
}

/**
 * Merge step definitions from several sources.
 */
function mergeSteps(...groups) {
  const seen = new Set();
  const output = [];

  for (const group of groups) {
    if (!Array.isArray(group)) {
      continue;
    }

    for (const item of group) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const id = String(item.id || "").trim();

      if (!id || seen.has(id)) {
        continue;
      }

      seen.add(id);

      output.push({
        id,
        title: String(item.title || id),
        description: String(item.description || ""),
        status: "pending",
        required: item.required !== false,
        sourceIds: Array.isArray(item.sourceIds)
          ? [...item.sourceIds]
          : []
      });
    }
  }

  return output;
}

/**
 * Merge source references by ID.
 */
function mergeSources(...groups) {
  const seen = new Set();
  const output = [];

  for (const group of groups) {
    if (!Array.isArray(group)) {
      continue;
    }

    for (const source of group) {
      if (!source || typeof source !== "object") {
        continue;
      }

      const id = String(source.id || "").trim();

      if (!id || seen.has(id)) {
        continue;
      }

      seen.add(id);

      output.push({
        id,
        title: String(source.title || id),
        url: String(source.url || ""),
        reference: String(source.reference || ""),
        verifiedAt: String(source.verifiedAt || "")
      });
    }
  }

  return output;
}

/**
 * Build a workflow from shared and scenario-specific rules.
 *
 * Input format:
 * {
 *   matter: { companyName, canton, ... },
 *   definition: {
 *     id, steps, sources,
 *     requiredFields?, warnings?
 *   },
 *   overlays: [
 *     { steps?, sources?, warnings?, requiredFields? }
 *   ]
 * }
 */
export function buildWorkflow({
  matter,
  definition,
  overlays = []
}) {
  if (!matter || typeof matter !== "object") {
    throw new Error("Matter data is missing.");
  }

  validateDefinition(definition);

  if (!Array.isArray(overlays)) {
    throw new Error("Workflow overlays must be an array.");
  }

  const requiredFields = uniqueStrings([
    ...(definition.requiredFields || []),
    ...overlays.flatMap(
      (overlay) => overlay.requiredFields || []
    )
  ]);

  const missingFields = findMissingFields(
    matter,
    requiredFields
  );

  const steps = mergeSteps(
    definition.steps,
    ...overlays.map((overlay) => overlay.steps)
  );

  const sources = mergeSources(
    definition.sources,
    ...overlays.map((overlay) => overlay.sources)
  );

  const warnings = uniqueStrings([
    ...(definition.warnings || []),
    ...overlays.flatMap(
      (overlay) => overlay.warnings || []
    )
  ]);

  return {
    id: definition.id,
    version: "0.1.0",
    createdAt: new Date().toISOString(),

    matter: { ...matter },

    status: missingFields.length > 0
      ? "incomplete"
      : "pending_review",

    missingFields,
    steps,
    sources,
    warnings,

    review: {
      required: true,
      approved: false,
      reviewedBy: null,
      reviewedAt: null
    }
  };
}

/**
 * Safely mark a workflow step as complete.
 *
 * This does NOT imply legal approval.
 */
export function updateStepStatus(
  workflow,
  stepId,
  status
) {
  const allowedStatuses = [
    "pending",
    "completed",
    "blocked",
    "not_applicable"
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Unsupported step status.");
  }

  const step = workflow.steps.find(
    (item) => item.id === stepId
  );

  if (!step) {
    throw new Error("Workflow step not found.");
  }

  return {
    ...workflow,
    steps: workflow.steps.map((item) =>
      item.id === stepId
        ? { ...item, status }
        : { ...item }
    ),
    review: {
      ...workflow.review,
      approved: false,
      reviewedBy: null,
      reviewedAt: null
    }
  };
}

/**
 * Summary for reporting or export.
 */
export function summarizeWorkflow(workflow) {
  const total = workflow.steps.length;

  const completed = workflow.steps.filter(
    (step) => step.status === "completed"
  ).length;

  const blocked = workflow.steps.filter(
    (step) => step.status === "blocked"
  ).length;

  return {
    id: workflow.id,
    status: workflow.status,
    total,
    completed,
    blocked,
    remaining: total - completed - blocked,
    missingFields: [...workflow.missingFields],
    requiresHumanReview: workflow.review.required
  };
}
