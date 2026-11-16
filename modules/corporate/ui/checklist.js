
/**
 * LexBridge — Corporate Checklist UI
 * Version: 0.4.1
 *
 * Stable step IDs drive legal translations.
 * Existing workflow data and statuses are preserved.
 */

"use strict";

import {
  t,
  tLegal,
  loadLegalContent,
  onLanguageChange
} from "../../../js/core/i18n.js";

const STEP_STATUSES = Object.freeze([
  "pending",
  "completed",
  "blocked",
  "not_applicable"
]);

// Existing workflow IDs are kept unchanged.
// Each ID points to its legal translation entry.
const STEP_KEY_BY_ID = Object.freeze({
  "verify-company": "verifyCompanyRegistration",
  "review-articles": "reviewArticles",
  "identify-authority": "identifyCompetentBody",
  "verify-evidence": "reviewSupportingEvidence",
  "check-representation": "checkCompanyRepresentation",
  "prepare-filing": "prepareFiling",
  "human-review": "humanReview",

  "appointment-decision": "appointmentDecision",
  "acceptance": "acceptance",
  "identity-signature": "identitySignature",
  "appointment-powers": "appointmentPowers",

  "departure-basis": "departureBasis",
  "departure-evidence": "departureEvidence",
  "cancel-signature": "cancelSignature",
  "remaining-management": "remainingManagement",

  "current-signature": "currentSignature",
  "signature-decision": "signatureDecision",
  "signature-mode": "signatureMode",
  "new-signatory-docs": "newSignatoryDocs",

  "sa-board-structure": "saBoardStructure",
  "sarl-management-structure": "sarlManagementStructure"
});

function element(tag, text = null, className = "") {
  const node = document.createElement(tag);

  if (text !== null && text !== undefined) {
    node.textContent = String(text);
  }

  if (className) {
    node.className = className;
  }

  return node;
}

function legalText(step, field) {
  const original = String(step[field] ?? "");

  const explicitKey = step[field + "Key"];
  const mappedName = STEP_KEY_BY_ID[step.id];

  const key = explicitKey || (
    mappedName
      ? `corporate.workflowSteps.${mappedName}.${field}`
      : null
  );

  return key
    ? tLegal(key, {}, original)
    : original;
}

/**
 * Render the corporate checklist.
 *
 * @param {Object} workflow
 * @param {Function} onChange
 * @returns {HTMLElement}
 */
export function renderChecklist(workflow, onChange) {
  if (!workflow || !Array.isArray(workflow.steps)) {
    throw new Error(
      "Invalid workflow data supplied to checklist."
    );
  }

  if (typeof onChange !== "function") {
    throw new Error(
      "Checklist requires an onChange callback."
    );
  }

  const section = element(
    "section",
    null,
    "card"
  );

  section.style.marginBottom = "18px";

  const heading = element("h3");

  const introduction = element(
    "p",
    null,
    "card-description"
  );

  section.append(heading, introduction);

  const updateItems = [];

  // Empty workflow.
  if (workflow.steps.length === 0) {
    const empty = element(
      "p",
      null,
      "card-description"
    );

    section.append(empty);

    updateItems.push(() => {
      empty.textContent = t("workflow.noSteps");
    });
  } else {
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
        "1px solid var(--color-border)";

      item.dataset.stepId = step.id;

      // Step title and description.
      const title = element("h4");

      title.style.margin = "0 0 5px";

      const description = element(
        "p",
        null,
        "card-description"
      );

      // Review status label.
      const label = element(
        "label",
        null,
        "form-label"
      );

      label.style.display = "block";
      label.style.marginTop = "10px";
      label.style.marginBottom = "7px";

      // Review status control.
      const select = element(
        "select",
        null,
        "form-control"
      );

      select.style.display = "block";
      select.style.maxWidth = "220px";
      select.style.width = "100%";

      const selectId = "step-status-" +
        String(step.id).replace(
          /[^a-zA-Z0-9_-]/g,
          "-"
        );

      select.id = selectId;
      label.htmlFor = selectId;

      const optionElements = new Map();

      for (const status of STEP_STATUSES) {
        const option = element("option");

        option.value = status;
        select.append(option);

        optionElements.set(status, option);
      }

      // Preserve the stored status ID.
      select.value = STEP_STATUSES.includes(
        step.status
      )
        ? step.status
        : "pending";

      select.addEventListener("change", () => {
        onChange(step.id, select.value);
      });

      item.append(
        title,
        description,
        label,
        select
      );

      // Official source references.
      const sourceIds = Array.isArray(
        step.sourceIds
      )
        ? step.sourceIds
        : [];

      let sources = null;

      if (sourceIds.length) {
        sources = element("small");

        sources.style.display = "block";
        sources.style.marginTop = "8px";

        sources.style.color =
          "var(--color-text-muted, #687587)";

        item.append(sources);
      }

      // Optional step indicator.
      let optional = null;

      if (step.required === false) {
        optional = element("small");

        optional.style.display = "block";
        optional.style.marginTop = "5px";

        optional.style.color =
          "var(--color-text-muted, #687587)";

        item.append(optional);
      }

      // Update text only, never step IDs or values.
      updateItems.push(() => {
        title.textContent = legalText(
          step,
          "title"
        );

        description.textContent = legalText(
          step,
          "description"
        );

        label.textContent = t(
          "workflow.stepStatus"
        );

        for (const status of STEP_STATUSES) {
          optionElements.get(status).textContent =
            t("stepStatuses." + status);
        }

        if (sources) {
          sources.textContent =
            t("workflow.sourceIds") +
            ": " +
            sourceIds.join(", ");
        }

        if (optional) {
          optional.textContent = t(
            "workflow.optionalStep"
          );
        }
      });

      list.append(item);
    }

    section.append(list);
  }

  function updateTranslations() {
    heading.textContent = t(
      "workflow.checklist"
    );

    introduction.textContent = t(
      "workflow.checklistDescription"
    );

    for (const update of updateItems) {
      update();
    }
  }

  // Initial render.
  updateTranslations();

  // Update visible labels on language change.
  let disposed = false;

  const unsubscribe = onLanguageChange(() => {
    if (disposed) return;

    if (!section.isConnected) {
      dispose();
      return;
    }

    updateTranslations();
  });

  function dispose() {
    if (disposed) return;

    disposed = true;
    unsubscribe();
  }

  // Optional cleanup for the pagination controller.
  section.destroyTranslations = dispose;

  // Load legal translations asynchronously.
  // The original text remains as a fallback.
  loadLegalContent()
    .then(() => {
      if (!disposed && section.isConnected) {
        updateTranslations();
      }
    })
    .catch((error) => {
      console.warn(
        "[LexBridge checklist] Legal content unavailable:",
        error
      );
    });

  return section;
}
