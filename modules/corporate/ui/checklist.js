
/**
 * LexBridge — Corporate Checklist UI
 * Version: 0.3.0
 *
 * Displays workflow steps and their review statuses.
 *
 * This file:
 * - Does not fetch legal data.
 * - Does not modify the legal workflow engine.
 * - Does not decide legal compliance.
 * - Notifies its parent when a step status changes.
 */

"use strict";

const STEP_STATUSES = Object.freeze([
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "blocked", label: "Blocked" },
  { id: "not_applicable", label: "Not applicable" }
]);

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

/**
 * Create a section showing the workflow checklist.
 *
 * @param {Object} workflow - Generated workflow object.
 * @param {Function} onChange - Callback(stepId, status).
 * @returns {HTMLElement}
 */
export function renderChecklist(workflow, onChange) {
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

  const section = element("section", null, "card");
  section.style.marginBottom = "18px";

  const heading = element(
    "h3",
    "Workflow checklist"
  );

  const introduction = element(
    "p",
    "Track the review status of each step. " +
    "Completing a step is not legal approval.",
    "card-description"
  );

  section.append(heading, introduction);

  if (workflow.steps.length === 0) {
    section.appendChild(
      element(
        "p",
        "No workflow steps are available.",
        "card-description"
      )
    );

    return section;
  }

  const list = element("div");
  list.className = "workflow-step-list";

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

    const title = element(
      "h4",
      step.title
    );

    title.style.margin = "0 0 5px";

    const description = element(
      "p",
      step.description || "",
      "card-description"
    );

    const label = element(
      "label",
      "Review status",
      "form-label"
    );

    label.style.display = "block";
    label.style.marginTop = "10px";

    const select = element(
      "select",
      null,
      "form-control"
    );

    select.style.maxWidth = "220px";

    const selectId =
      "step-status-" +
      String(step.id).replace(/[^a-zA-Z0-9_-]/g, "-");

    select.id = selectId;
    label.htmlFor = selectId;

    for (const status of STEP_STATUSES) {
      const option = element(
        "option",
        status.label
      );

      option.value = status.id;
      select.appendChild(option);
    }

    select.value = STEP_STATUSES.some(
      (status) => status.id === step.status
    )
      ? step.status
      : "pending";

    select.addEventListener("change", () => {
      onChange(step.id, select.value);
    });

    const sourceIds = Array.isArray(step.sourceIds)
      ? step.sourceIds
      : [];

    label.appendChild(select);
    item.append(title, description, label);

    if (sourceIds.length > 0) {
      const sources = element(
        "small",
        "Source IDs: " + sourceIds.join(", ")
      );

      sources.style.display = "block";
      sources.style.marginTop = "8px";
      sources.style.color =
        "var(--color-text-muted, #687587)";

      item.appendChild(sources);
    }

    if (step.required === false) {
      const optional = element(
        "small",
        "Optional review step"
      );

      optional.style.display = "block";
      optional.style.marginTop = "5px";
      optional.style.color =
        "var(--color-text-muted, #687587)";

      item.appendChild(optional);
    }

    list.appendChild(item);
  }

  section.appendChild(list);

  return section;
}
