
/**
 * LexBridge — Corporate Report UI
 * Version: 0.5.0
 *
 * Independent report sections:
 * - Workflow overview and paginated checklist
 * - Legal considerations
 * - Official legal sources
 *
 * Maintains compatibility with the existing
 * Corporate module and checklist engine.
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
// DOM UTILITIES
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

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
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

  const completed =
    Number(summary.completed) || 0;

  const total =
    Number(summary.total) || 0;

  const progressText = el(
    "p",
    `${completed} of ${total} steps completed`
  );

  progressText.style.marginTop = "12px";

  const progress = el("progress");

  progress.max = Math.max(total, 1);
  progress.value = Math.min(
    completed,
    progress.max
  );

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

  const missing = Array.isArray(
    summary.missingFields
  )
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

  const introduction = el(
    "p",
    "Review the following considerations " +
    "before preparing or filing documents.",
    "card-description"
  );

  const list = el("ul");

  for (const warning of warnings) {
    const message =
      typeof warning === "string"
        ? warning
        : warning?.message ||
          warning?.text ||
          "Review required";

    const item = el("li", message);
    item.style.marginBottom = "12px";

    list.appendChild(item);
  }

  section.append(
    introduction,
    list
  );

  return section;
}

// ---------------------------------------------
// REPORT CONTROLLER
// ---------------------------------------------

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

  // Stable section elements.
  // These can be moved into independent pages
  // without losing their event listeners.
  const workflowSection = el(
    "section",
    null,
    "lb-report-workflow"
  );

  const warningsSection = el(
    "section",
    null,
    "lb-report-warnings"
  );

  const sourcesSection = el(
    "section",
    null,
    "lb-report-sources"
  );

  const summaryContainer = el("div");
  const checklistContainer = el("div");
  const workflowFooter = el("div");

  workflowSection.append(
    summaryContainer,
    checklistContainer,
    workflowFooter
  );

  // Initially keep the existing stacked layout.
  // The next step will move these elements into
  // the Corporate Section Navigator.
  container.append(
    workflowSection,
    warningsSection,
    sourcesSection
  );

  // -------------------------------------------
  // REPORT EXPORT ACTIONS
  // -------------------------------------------

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

  const disclaimer = el(
    "p",
    "Preliminary rule-based legal workflow. " +
    "Human review is required before any filing.",
    "card-description"
  );

  disclaimer.style.marginTop = "15px";

  workflowFooter.append(
    exportButton,
    disclaimer
  );

  // -------------------------------------------
  // UPDATE SUMMARY ONLY
  // -------------------------------------------

  function refreshSummary() {
    if (!currentWorkflow) return;

    summaryContainer.replaceChildren(
      renderSummary(currentWorkflow)
    );
  }

  // -------------------------------------------
  // CHECKLIST STATUS CHANGES
  // -------------------------------------------

  function changeStep(stepId, status) {
    try {
      if (!currentWorkflow) {
        throw new Error(
          "No active workflow is available."
        );
      }

      currentWorkflow = updateStepStatus(
        currentWorkflow,
        stepId,
        status
      );

      refreshSummary();

      // Keep the current checklist page.
      if (pagination) {
        pagination.updateWorkflow(
          currentWorkflow
        );
      }

    } catch (error) {
      if (
        typeof context?.reportError ===
        "function"
      ) {
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
  // RENDER INDEPENDENT SECTIONS
  // -------------------------------------------

  function render() {
    if (!currentWorkflow) return;

    // 1. Overview
    refreshSummary();

    // 2. Paginated checklist
    pagination = createChecklistPagination({
      workflow: currentWorkflow,
      onChange: changeStep,
      pageSize: 5
    });

    checklistContainer.replaceChildren(
      pagination.element
    );

    // 3. Legal considerations
    warningsSection.replaceChildren(
      renderWarnings(currentWorkflow)
    );

    // 4. Official sources
    sourcesSection.replaceChildren(
      renderSources(currentWorkflow)
    );

    // Existing interface compatibility.
    container.hidden = false;
  }

  // -------------------------------------------
  // PUBLIC API
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
      render();
    },

    getWorkflow() {
      return currentWorkflow;
    },

    /**
     * Returns the actual section elements.
     *
     * Used by Corporate Section Navigator.
     * Moving these nodes preserves their state.
     */
    getSections() {
      return {
        workflow: workflowSection,
        warnings: warningsSection,
        sources: sourcesSection
      };
    },

    clear() {
      currentWorkflow = null;
      pagination = null;

      summaryContainer.replaceChildren();
      checklistContainer.replaceChildren();
      warningsSection.replaceChildren();
      sourcesSection.replaceChildren();

      container.hidden = true;
    }
  };
}
