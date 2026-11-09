
/**
 * LexBridge — Corporate Report UI
 * Version: 0.4.0
 *
 * Features:
 * - Workflow summary
 * - Paginated checklist (5 steps per group)
 * - Legal considerations
 * - Official legal sources
 * - JSON export
 *
 * Preserves checklist page when step status changes.
 *
 * No legal interpretation or network requests.
 */

"use strict";

import {
  updateStepStatus,
  summarizeWorkflow
} from "../../../js/core/workflow-engine.js";

import {
  createChecklistPagination
} from "./checklist-pagination.js";

import {
  renderSources
} from "./sources.js";

// ---------------------------------------------
// DOM HELPERS
// ---------------------------------------------

function el(tag, text, className = "") {
  const node = document.createElement(tag);

  if (text !== undefined && text !== null) {
    node.textContent = String(text);
  }

  if (className) {
    node.className = className;
  }

  return node;
}

// ---------------------------------------------
// JSON EXPORT
// ---------------------------------------------

function downloadJSON(workflow) {
  const json = JSON.stringify(workflow, null, 2);

  const blob = new Blob([json], {
    type: "application/json;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "lexbridge-corporate-report.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------
// WORKFLOW SUMMARY
// ---------------------------------------------

function renderSummary(workflow) {
  const summary = summarizeWorkflow(workflow);

  const section = el("section", null, "card");
  section.style.marginBottom = "18px";

  section.appendChild(
    el("h3", "Workflow Overview")
  );

  const matter = workflow.matter || {};

  const company = el(
    "p",
    matter.companyName || "Unnamed company"
  );

  company.style.fontWeight = "700";

  const details = el(
    "p",
    [
      matter.companyType,
      matter.canton,
      matter.operation
    ].filter(Boolean).join(" · "),
    "card-description"
  );

  const status = el(
    "p",
    "Status: " + (workflow.status || "pending"),
    "status-badge status-warning"
  );

  const completed = Number(summary.completed) || 0;
  const total = Number(summary.total) || 0;

  const progressText = el(
    "p",
    `${completed} of ${total} steps completed`
  );

  progressText.style.marginTop = "12px";

  const progress = el("progress");
  progress.max = Math.max(total, 1);
  progress.value = Math.min(completed, progress.max);
  progress.style.width = "100%";

  progress.setAttribute(
    "aria-label",
    "Workflow completion"
  );

  section.append(
    company,
    details,
    status,
    progressText,
    progress
  );

  const missing = Array.isArray(summary.missingFields)
    ? summary.missingFields
    : [];

  if (missing.length > 0) {
    const warning = el(
      "p",
      "Missing fields: " + missing.join(", ")
    );

    warning.style.color = "#a52727";
    section.appendChild(warning);
  }

  return section;
}

// ---------------------------------------------
// LEGAL CONSIDERATIONS
// ---------------------------------------------

function renderWarnings(workflow) {
  const section = el("section", null, "card");
  section.style.marginBottom = "18px";

  section.appendChild(
    el("h3", "Legal Considerations")
  );

  const warnings = Array.isArray(workflow.warnings)
    ? workflow.warnings
    : [];

  if (warnings.length === 0) {
    section.appendChild(
      el(
        "p",
        "No additional warnings are recorded. " +
        "Human legal review is still required.",
        "card-description"
      )
    );

    return section;
  }

  const list = el("ul");

  for (const warning of warnings) {
    const item = el(
      "li",
      typeof warning === "string"
        ? warning
        : warning?.message ||
          warning?.text ||
          "Review required"
    );

    item.style.marginBottom = "10px";
    list.appendChild(item);
  }

  section.appendChild(list);

  return section;
}

// ---------------------------------------------
// REPORT CONTROLLER
// ---------------------------------------------

/**
 * Creates a controller for the corporate report.
 *
 * @param {object} context Shared app context.
 * @param {HTMLElement} container Report container.
 */
export function createReportController(
  context,
  container
) {
  if (!(container instanceof HTMLElement)) {
    throw new Error(
      "A valid report container is required."
    );
  }

  let currentWorkflow = null;
  let pagination = null;
  let summaryContainer = null;

  // -------------------------------------------
  // HANDLE CHECKLIST STATUS CHANGES
  // -------------------------------------------

  function changeStep(stepId, status) {
    try {
      if (!currentWorkflow) {
        throw new Error(
          "No active workflow is available."
        );
      }

      const updated = updateStepStatus(
        currentWorkflow,
        stepId,
        status
      );

      currentWorkflow = updated;

      // Refresh only the summary.
      // Do not recreate the whole report.
      const newSummary = renderSummary(
        currentWorkflow
      );

      summaryContainer.replaceChildren(newSummary);

      // Refresh the active checklist group,
      // preserving the current page number.
      if (pagination) {
        pagination.updateWorkflow(currentWorkflow);
      }

    } catch (error) {
      if (typeof context?.reportError === "function") {
        context.reportError(
          error,
          "Corporate checklist update"
        );
      } else {
        console.error(error);
      }
    }
  }

  // -------------------------------------------
  // RENDER FULL REPORT
  // -------------------------------------------

  function render() {
    if (!currentWorkflow) {
      return;
    }

    container.replaceChildren();
    container.hidden = false;

    // 1. Workflow overview
    summaryContainer = el("div");
    summaryContainer.appendChild(
      renderSummary(currentWorkflow)
    );

    // 2. Paginated checklist
    pagination = createChecklistPagination({
      workflow: currentWorkflow,
      onChange: changeStep,
      pageSize: 5
    });

    // 3. Legal considerations
    const warningsSection =
      renderWarnings(currentWorkflow);

    // 4. Official legal sources
    const sourcesSection =
      renderSources(currentWorkflow);

    // 5. Export actions
    const actions = el("div");
    actions.style.marginTop = "18px";

    const exportButton = el(
      "button",
      "Export JSON",
      "btn btn-secondary"
    );

    exportButton.type = "button";

    exportButton.addEventListener(
      "click",
      () => {
        if (currentWorkflow) {
          downloadJSON(currentWorkflow);
        }
      }
    );

    actions.appendChild(exportButton);

    const disclaimer = el(
      "p",
      "Preliminary rule-based legal workflow. " +
      "Human review is required before any filing.",
      "card-description"
    );

    disclaimer.style.marginTop = "15px";

    container.append(
      summaryContainer,
      pagination.element,
      warningsSection,
      sourcesSection,
      actions,
      disclaimer
    );
  }

  // -------------------------------------------
  // PUBLIC CONTROLLER API
  // -------------------------------------------

  return {
    setWorkflow(workflow) {
      if (
        !workflow ||
        !Array.isArray(workflow.steps)
      ) {
        throw new Error(
          "Invalid workflow report data."
        );
      }

      currentWorkflow = workflow;
      pagination = null;

      render();
    },

    getWorkflow() {
      return currentWorkflow;
    },

    clear() {
      currentWorkflow = null;
      pagination = null;
      summaryContainer = null;

      container.replaceChildren();
      container.hidden = true;
    }
  };
}
