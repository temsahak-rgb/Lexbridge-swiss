
/**
 * LexBridge — Corporate Report UI
 * Version: 0.3.0
 *
 * Combines workflow summary, checklist,
 * legal warnings and official sources.
 *
 * No legal analysis or network requests.
 */

"use strict";

import {
  updateStepStatus,
  summarizeWorkflow
} from "../../../js/core/workflow-engine.js";

import {
  renderChecklist
} from "./checklist.js";

import {
  renderSources
} from "./sources.js";

// -------------------------------------------
// DOM UTILITIES
// -------------------------------------------

function element(tag, text, className) {
  const node = document.createElement(tag);

  if (text !== undefined && text !== null) {
    node.textContent = String(text);
  }

  if (className) {
    node.className = className;
  }

  return node;
}

// -------------------------------------------
// EXPORT
// -------------------------------------------

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

// -------------------------------------------
// SUMMARY
// -------------------------------------------

function renderSummary(workflow) {
  const summary = summarizeWorkflow(workflow);

  const section = element("section", null, "card");
  section.style.marginBottom = "18px";

  section.appendChild(
    element("h3", "Workflow overview")
  );

  const company = element(
    "p",
    workflow.matter.companyName
  );

  company.style.fontWeight = "700";

  const details = element(
    "p",
    [
      workflow.matter.companyType,
      workflow.matter.canton,
      workflow.matter.operation
    ].join(" · "),
    "card-description"
  );

  const status = element(
    "p",
    "Status: " + workflow.status,
    "status-badge status-warning"
  );

  status.style.marginTop = "12px";

  const progressText = element(
    "p",
    summary.completed + " of " +
    summary.total + " steps completed"
  );

  progressText.style.marginTop = "12px";

  const progress = element("progress");
  progress.max = Math.max(summary.total, 1);
  progress.value = summary.completed;
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

  if (summary.missingFields.length > 0) {
    const missing = element(
      "p",
      "Missing fields: " +
      summary.missingFields.join(", ")
    );

    missing.style.color = "#a52727";
    section.appendChild(missing);
  }

  return section;
}

// -------------------------------------------
// WARNINGS
// -------------------------------------------

function renderWarnings(workflow) {
  const section = element("section", null, "card");
  section.style.marginBottom = "18px";

  section.appendChild(
    element("h3", "Legal considerations")
  );

  if (!workflow.warnings.length) {
    section.appendChild(
      element(
        "p",
        "No additional warnings are recorded.",
        "card-description"
      )
    );

    return section;
  }

  const list = element("ul");

  for (const warning of workflow.warnings) {
    const item = element("li", warning);
    item.style.marginBottom = "9px";
    list.appendChild(item);
  }

  section.appendChild(list);
  return section;
}

// -------------------------------------------
// REPORT CONTROLLER
// -------------------------------------------

/**
 * Create a report controller.
 *
 * @param {object} context Shared application context.
 * @param {HTMLElement} container Report mounting point.
 */
export function createReportController(context, container) {
  if (!container) {
    throw new Error("Report container is required.");
  }

  let currentWorkflow = null;

  function render() {
    if (!currentWorkflow) return;

    container.replaceChildren();
    container.hidden = false;

    container.appendChild(
      renderSummary(currentWorkflow)
    );

    container.appendChild(
      renderChecklist(
        currentWorkflow,
        changeStep
      )
    );

    container.appendChild(
      renderWarnings(currentWorkflow)
    );

    container.appendChild(
      renderSources(currentWorkflow)
    );

    const actions = element("div");
    actions.style.marginTop = "18px";

    const exportButton = element(
      "button",
      "Export JSON",
      "btn btn-secondary"
    );

    exportButton.type = "button";

    exportButton.addEventListener(
      "click",
      () => downloadJSON(currentWorkflow)
    );

    actions.appendChild(exportButton);

    const disclaimer = element(
      "p",
      "Preliminary rule-based legal workflow. " +
      "Human review is required before any filing.",
      "card-description"
    );

    disclaimer.style.marginTop = "15px";

    container.append(
      actions,
      disclaimer
    );
  }

  function changeStep(stepId, status) {
    try {
      currentWorkflow = updateStepStatus(
        currentWorkflow,
        stepId,
        status
      );

      render();

    } catch (error) {
      context.reportError(
        error,
        "Corporate checklist update"
      );
    }
  }

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

    clear() {
      currentWorkflow = null;
      container.replaceChildren();
      container.hidden = true;
    }
  };
}
