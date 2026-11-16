
/**
 * LexBridge — Corporate Checklist UI
 * Version: 0.4.0
 *
 * Key-based multilingual checklist.
 *
 * - English / French / German
 * - Uses the central i18n engine
 * - Uses legal-content.json for legal text
 * - Preserves step IDs and status values
 * - Does not modify workflow data
 * - Does not decide legal compliance
 * - Does not recreate controls on language change
 *
 * Compatible with checklist-pagination.js
 * and report.js.
 */

"use strict";

import {
  t,
  tLegal,
  loadLegalContent,
  onLanguageChange
} from "../../../js/core/i18n.js";

// ---------------------------------------------
// FIXED STATUS VALUES
// ---------------------------------------------

const STEP_STATUSES = Object.freeze([
  "pending",
  "completed",
  "blocked",
  "not_applicable"
]);

// ---------------------------------------------
// LEGACY WORKFLOW MIGRATION
// ---------------------------------------------

/**
 * Existing workflows use English titles.
 *
 * Until workflows.json and cantonal files
 * provide stable translation keys, map
 * the five reviewed titles to their IDs.
 *
 * New workflows should provide titleKey
 * and descriptionKey directly.
 *
 * Never use translated text as a step ID.
 */

const LEGACY_LEGAL_KEYS = Object.freeze({
  "Verify company registration":
    "corporate.workflowSteps.verifyCompanyRegistration",

  "Review articles of association":
    "corporate.workflowSteps.reviewArticles",

  "Identify the competent corporate body":
    "corporate.workflowSteps.identifyCompetentBody",

  "Review supporting evidence":
    "corporate.workflowSteps.reviewSupportingEvidence",

  "Check company representation":
    "corporate.workflowSteps.checkCompanyRepresentation"
});

// ---------------------------------------------
// DOM HELPERS
// ---------------------------------------------

function element(
  tag,
  text = null,
  className = ""
) {
  const node = document.createElement(tag);

  if (text !== null && text !== undefined) {
    node.textContent = String(text);
  }

  if (className) {
    node.className = className;
  }

  return node;
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve translation keys without
 * changing the original step.
 */

function getStepTranslationKeys(step) {
  const legacyBase =
    LEGACY_LEGAL_KEYS[
      normalizeText(step.title)
    ];

  return {
    titleKey:
      step.titleKey ||
      (legacyBase
        ? legacyBase + ".title"
        : null),

    descriptionKey:
      step.descriptionKey ||
      (legacyBase
        ? legacyBase + ".description"
        : null)
  };
}

function legalDisplay(
  key,
  fallback
) {
  if (!key) {
    return String(fallback ?? "");
  }

  return tLegal(
    key,
    {},
    String(fallback ?? "")
  );
}

// ---------------------------------------------
// CHECKLIST
// ---------------------------------------------

/**
 * @param {Object} workflow
 * @param {Function} onChange
 *
 * @returns {HTMLElement}
 *
 * Existing public API is unchanged.
 */

export function renderChecklist(
  workflow,
  onChange
) {
  if (
    !workflow ||
    !Array.isArray(workflow.steps)
  ) {
    throw new Error(
      "Invalid workflow data supplied to checklist."
    );
  }

  if (typeof onChange !== "function") {
    throw new Error(
      "Checklist requires an onChange callback."
    );
  }

  // -------------------------------------------
  // ROOT ELEMENT
  // -------------------------------------------

  const section = element(
    "section",
    null,
    "card"
  );

  section.style.marginBottom = "18px";

  const heading = element("h3");

  const introduction = element(
    "p",
    "",
    "card-description"
  );

  section.append(
    heading,
    introduction
  );

  const translationUpdates = [];

  // -------------------------------------------
  // EMPTY WORKFLOW
  // -------------------------------------------

  if (workflow.steps.length === 0) {
    const emptyMessage = element(
      "p",
      "",
      "card-description"
    );

    section.appendChild(emptyMessage);

    translationUpdates.push(() => {
      emptyMessage.textContent =
        t("workflow.noSteps");
    });
  }

  // -------------------------------------------
  // CHECKLIST ITEMS
  // -------------------------------------------

  const list = element(
    "div",
    null,
    "workflow-step-list"
  );

  for (const step of workflow.steps) {
    const item = element(
      "article",
      null,
      "workflow-step"
    );

    item.style.padding = "15px 0";

    item.style.borderBottom =
      "1px solid var(--color-border, #dce3ea)";

    item.dataset.stepId = String(step.id);

    const translationKeys =
      getStepTranslationKeys(step);

    // -----------------------------------------
    // TITLE
    // -----------------------------------------

    const title = element("h4");

    title.style.margin = "0 0 5px";

    // -----------------------------------------
    // DESCRIPTION
    // -----------------------------------------

    const description = element(
      "p",
      "",
      "card-description"
    );

    // -----------------------------------------
    // REVIEW STATUS LABEL
    // -----------------------------------------

    const label = element(
      "label",
      "",
      "form-label"
    );

    label.style.display = "block";
    label.style.marginTop = "12px";
    label.style.marginBottom = "7px";
    label.style.lineHeight = "1.5";

    // -----------------------------------------
    // STATUS SELECT
    // -----------------------------------------

    const select = element(
      "select",
      null,
      "form-control"
    );

    select.style.display = "block";
    select.style.width = "100%";
    select.style.maxWidth = "220px";

    const selectId =
      "step-status-" +
      String(step.id).replace(
        /[^a-zA-Z0-9_-]/g,
        "-"
      );

    select.id = selectId;
    label.htmlFor = selectId;

    const options = new Map();

    for (const status of STEP_STATUSES) {
      const option = element("option");

      option.value = status;

      select.appendChild(option);

      options.set(status, option);
    }

    select.value = STEP_STATUSES.includes(
      step.status
    )
      ? step.status
      : "pending";

    select.addEventListener(
      "change",
      () => {
        // Only IDs are passed to the
        // workflow engine.
        onChange(
          step.id,
          select.value
        );
      }
    );

    // -----------------------------------------
    // SOURCE REFERENCES
    // -----------------------------------------

    const sourceIds = Array.isArray(
      step.sourceIds
    )
      ? step.sourceIds
      : [];

    let sources = null;

    if (sourceIds.length > 0) {
      sources = element("small");

      sources.style.display = "block";
      sources.style.marginTop = "8px";

      sources.style.color =
        "var(--color-text-muted, #687587)";

      // Source IDs remain unchanged.
      item.appendChild(sources);
    }

    // -----------------------------------------
    // OPTIONAL REVIEW STEP
    // -----------------------------------------

    let optional = null;

    if (step.required === false) {
      optional = element("small");

      optional.style.display = "block";
      optional.style.marginTop = "5px";

      optional.style.color =
        "var(--color-text-muted, #687587)";
    }

    // -----------------------------------------
    // ASSEMBLE ITEM
    // -----------------------------------------

    item.prepend(
      title,
      description,
      label,
      select
    );

    if (optional) {
      item.appendChild(optional);
    }

    list.appendChild(item);

    // -----------------------------------------
    // ITEM TRANSLATION FUNCTION
    // -----------------------------------------

    translationUpdates.push(() => {
      title.textContent = legalDisplay(
        translationKeys.titleKey,
        step.title
      );

      description.textContent = legalDisplay(
        translationKeys.descriptionKey,
        step.description || ""
      );

      label.textContent =
        t("workflow.stepStatus");

      for (const status of STEP_STATUSES) {
        const option = options.get(status);

        option.textContent = t(
          "stepStatuses." + status
        );
      }

      if (sources) {
        sources.textContent =
          t("workflow.sourceIds") +
          ": " +
          sourceIds.join(", ");
      }

      if (optional) {
        optional.textContent =
          t("workflow.optionalStep");
      }
    });
  }

  section.appendChild(list);

  // -------------------------------------------
  // CENTRALIZED TRANSLATION UPDATE
  // -------------------------------------------

  function updateTranslations() {
    heading.textContent =
      t("workflow.checklist");

    introduction.textContent =
      t("workflow.checklistDescription");

    // Updating option text never changes
    // select.value or checklist status.
    for (const update of translationUpdates) {
      update();
    }
  }

  // Translate immediately.
  updateTranslations();

  // -------------------------------------------
  // LANGUAGE CHANGE HANDLING
  // -------------------------------------------

  /*
   * The pagination controller may remove
   * and recreate checklist pages.
   *
   * A detached checklist unsubscribes
   * when the next language change occurs.
   *
   * This prevents old pages from continuing
   * to update indefinitely after navigation.
   */

  let unsubscribe = null;

  unsubscribe = onLanguageChange(() => {
    if (!section.isConnected) {
      unsubscribe?.();
      unsubscribe = null;
      return;
    }

    updateTranslations();
  });

  // -------------------------------------------
  // ASYNCHRONOUS LEGAL CONTENT
  // -------------------------------------------

  /*
   * The interface can render before the
   * legal translation file finishes loading.
   *
   * When loading completes, refresh only
   * the displayed text.
   *
   * The workflow and controls are untouched.
   */

  loadLegalContent()
    .then(() => {
      if (section.isConnected) {
        updateTranslations();
      }
    })
    .catch((error) => {
      console.warn(
        "[LexBridge checklist] " +
        "Legal translations unavailable:",
        error
      );
    });

  // -------------------------------------------
  // OPTIONAL CLEANUP API
  // -------------------------------------------

  /**
   * Allows future controllers to release
   * the translation subscription explicitly.
   *
   * Does not change renderChecklist's
   * existing return type.
   */

  section.destroyTranslations = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };

  return section;
}
