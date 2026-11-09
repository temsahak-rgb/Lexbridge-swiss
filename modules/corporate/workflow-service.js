
/**
 * LexBridge — Corporate Workflow Service
 * Version: 0.1.0
 *
 * Connects corporate workflow data, Swiss federal
 * legislation metadata and cantonal procedures.
 *
 * No AI, no external dependencies, no server storage.
 */

"use strict";

import {
  buildWorkflow
} from "../../js/core/workflow-engine.js";

// Allowed cantons.
// Do not interpolate unchecked user input into file paths.
const CANTON_FILES = Object.freeze({
  VD: "../../jurisdictions/CH/cantons/VD.json",
  GE: "../../jurisdictions/CH/cantons/GE.json",
  ZH: "../../jurisdictions/CH/cantons/ZH.json",
  BS: "../../jurisdictions/CH/cantons/BS.json"
});

const DATA_FILES = Object.freeze({
  workflows: "./workflows.json",
  federal: "../../jurisdictions/CH/federal/sources.json"
});

const cache = new Map();

/**
 * Fetch JSON relative to this JavaScript module.
 */
async function readJSON(path) {
  const url = new URL(path, import.meta.url).href;

  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Cannot load ${path} (HTTP ${response.status}).`
    );
  }

  const result = await response.json();

  if (!result || typeof result !== "object") {
    throw new Error(`Invalid JSON data: ${path}`);
  }

  cache.set(url, result);
  return result;
}

/**
 * Convert federal legislation metadata to source records.
 */
function getFederalSources(data, matter) {
  const sources = [];

  for (const law of data.legislation || []) {
    const articles = (law.articles || []).filter(
      (article) =>
        article.appliesTo?.includes(matter.companyType) &&
        article.operations?.includes(matter.operation)
    );

    sources.push({
      id: law.id,
      title: law.title?.en || law.shortName || law.id,
      url: law.officialUrl,
      reference: articles.length
        ? "Relevant articles to review: " +
          articles.map((a) => a.number).join(", ")
        : law.srNumber || "",
      verifiedAt: data.lastReviewed || ""
    });
  }

  for (const register of data.officialRegisters || []) {
    sources.push({
      id: register.id,
      title: register.title,
      url: register.officialUrl,
      reference: register.purpose || "",
      verifiedAt: data.lastReviewed || ""
    });
  }

  return sources;
}

/**
 * Select object safely from a dictionary.
 */
function selectEntry(dictionary, key) {
  if (!dictionary || typeof dictionary !== "object") {
    return null;
  }

  return Object.hasOwn(dictionary, key)
    ? dictionary[key]
    : null;
}

/**
 * Make a compatible overlay for the generic engine.
 */
function asOverlay(data) {
  if (!data) {
    return {
      steps: [],
      sources: [],
      warnings: [],
      requiredFields: []
    };
  }

  return {
    steps: Array.isArray(data.steps) ? data.steps : [],
    sources: Array.isArray(data.sources) ? data.sources : [],
    warnings: Array.isArray(data.warnings)
      ? data.warnings
      : [],
    requiredFields: Array.isArray(data.requiredFields)
      ? data.requiredFields
      : []
  };
}

/**
 * Generate a matter-specific preliminary workflow.
 */
export async function createCorporateWorkflow(matter) {
  if (!matter || typeof matter !== "object") {
    throw new Error("Corporate matter data is missing.");
  }

  if (!Object.hasOwn(CANTON_FILES, matter.canton)) {
    throw new Error("Unsupported canton: " + matter.canton);
  }

  const [workflowData, federalData, cantonData] =
    await Promise.all([
      readJSON(DATA_FILES.workflows),
      readJSON(DATA_FILES.federal),
      readJSON(CANTON_FILES[matter.canton])
    ]);

  if (cantonData.canton !== matter.canton) {
    throw new Error("Canton data does not match selection.");
  }

  if (
    !cantonData.scope?.companyTypes?.includes(matter.companyType) ||
    !cantonData.scope?.operations?.includes(matter.operation)
  ) {
    throw new Error(
      "This canton does not support the selected scenario."
    );
  }

  const operation = selectEntry(
    workflowData.operations,
    matter.operation
  );

  const company = selectEntry(
    workflowData.companyTypes,
    matter.companyType
  );

  const cantonOperation = selectEntry(
    cantonData.operations,
    matter.operation
  );

  const cantonCompany = selectEntry(
    cantonData.companyTypes,
    matter.companyType
  );

  if (!operation || !company) {
    throw new Error(
      "Unsupported corporate operation or company type."
    );
  }

  const definition = {
    id: [
      "CH",
      "CORPORATE",
      matter.companyType,
      matter.canton,
      matter.operation
    ].join("-"),

    requiredFields: workflowData.requiredFields || [],
    steps: workflowData.shared?.steps || [],
    sources: getFederalSources(federalData, matter),
    warnings: [
      ...(workflowData.shared?.warnings || []),
      federalData.disclaimer || ""
    ]
  };

  const overlays = [
    asOverlay(operation),
    asOverlay(company),
    asOverlay(cantonData),
    asOverlay(cantonOperation),
    asOverlay(cantonCompany)
  ];

  return buildWorkflow({
    matter,
    definition,
    overlays
  });
}
