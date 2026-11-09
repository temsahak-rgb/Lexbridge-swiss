
/**
 * LexBridge — Corporate Governance Module
 * Version: 0.2.0
 *
 * UI for Swiss corporate governance workflows.
 * Uses the shared workflow engine and legal datasets.
 *
 * No AI, no backend, no external dependencies.
 */

"use strict";

import {
  createCorporateWorkflow
} from "./workflow-service.js";

import {
  updateStepStatus,
  summarizeWorkflow
} from "../../js/core/workflow-engine.js";

// ---------------------------------------------
// SUPPORTED OPTIONS
// ---------------------------------------------

const COMPANY_TYPES = [
  { id: "SA", label: "SA / AG — Corporation" },
  { id: "SARL", label: "Sàrl / GmbH — Limited Liability Company" }
];

const CANTONS = [
  { id: "VD", label: "Vaud" },
  { id: "GE", label: "Geneva" },
  { id: "ZH", label: "Zurich" },
  { id: "BS", label: "Basel-Stadt" }
];

const OPERATIONS = [
  { id: "appoint", label: "Appointment of director / manager" },
  { id: "remove", label: "Removal or resignation" },
  { id: "signature", label: "Change of signing authority" }
];

const STEP_STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "blocked", label: "Blocked" },
  { id: "not_applicable", label: "Not applicable" }
];

// ---------------------------------------------
// DOM HELPERS
// ---------------------------------------------

function el(tag, text, className) {
  const node = document.createElement(tag);

  if (text !== undefined && text !== null) {
    node.textContent = String(text);
  }

  if (className) {
    node.className = className;
  }

  return node;
}

function addField(form, label, name, options = {}) {
  const wrapper = el("div", null, "form-group");
  const labelNode = el("label", label, "form-label");

  labelNode.htmlFor = "corporate-" + name;

  let control;

  if (options.choices) {
    control = el("select", null, "form-control");

    for (const choice of options.choices) {
      const option = el("option", choice.label);
      option.value = choice.id;
      control.appendChild(option);
    }
  } else {
    control = el("input", null, "form-control");
    control.type = "text";
    control.maxLength = options.maxLength || 120;
    control.placeholder = options.placeholder || "";
  }

  control.id = "corporate-" + name;
  control.name = name;
  control.required = options.required !== false;

  wrapper.append(labelNode, control);
  form.appendChild(wrapper);

  return control;
}

function getMatter(form) {
  const data = new FormData(form);

  const fields = [
    "companyName",
    "personName",
    "companyType",
    "canton",
    "operation"
  ];

  const matter = {};

  for (const field of fields) {
    matter[field] = String(data.get(field) || "").trim();
  }

  return matter;
}

// ---------------------------------------------
// DOWNLOAD SERVICE
// ---------------------------------------------

function downloadReport(workflow) {
  if (!workflow) return;

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
// WORKFLOW PRESENTATION
// ---------------------------------------------

function renderSummary(container, workflow) {
  const summary = summarizeWorkflow(workflow);

  const box = el("section", null, "card");
  box.style.marginBottom = "18px";

  const heading = el(
    "h3",
    "Workflow overview"
  );

  const company = el(
    "p",
    workflow.matter.companyName
  );

  company.style.fontWeight = "700";

  const details = el(
    "p",
    [
      workflow.matter.companyType,
      workflow.matter.canton,
      workflow.matter.operation
    ].join(" · "),
    "card-description"
  );

  const status = el(
    "p",
    "Status: " + workflow.status,
    "status-badge status-warning"
  );

  status.style.marginTop = "12px";

  const progress = el(
    "p",
    [
      summary.completed,
      "of",
      summary.total,
      "steps completed"
    ].join(" ")
  );

  progress.style.marginTop = "12px";

  const progressBar = el("progress");
  progressBar.max = Math.max(summary.total, 1);
  progressBar.value = summary.completed;
  progressBar.style.width = "100%";
  progressBar.setAttribute(
    "aria-label",
    "Workflow completion"
  );

  box.append(
    heading,
    company,
    details,
    status,
    progress,
    progressBar
  );

  if (summary.missingFields.length) {
    const missing = el(
      "p",
      "Missing fields: " +
      summary.missingFields.join(", ")
    );

    missing.style.color = "#a52727";
    box.appendChild(missing);
  }

  container.appendChild(box);
}

function renderSteps(
  container,
  workflow,
  onChange
) {
  const section = el("section", null, "card");
  section.style.marginBottom = "18px";

  section.appendChild(
    el("h3", "Workflow checklist")
  );

  const intro = el(
    "p",
    "Track the review status of each step. " +
    "Completing a step is not legal approval.",
    "card-description"
  );

  section.appendChild(intro);

  for (const step of workflow.steps) {
    const item = el("div");
    item.style.padding = "15px 0";
    item.style.borderBottom =
      "1px solid var(--color-border)";

    const title = el("h4", step.title);
    title.style.margin = "0 0 5px";

    const description = el(
      "p",
      step.description,
      "card-description"
    );

    const label = el(
      "label",
      "Review status",
      "form-label"
    );

    label.style.display = "block";
    label.style.marginTop = "10px";

    const select = el(
      "select",
      null,
      "form-control"
    );

    select.style.maxWidth = "220px";
    select.setAttribute(
      "aria-label",
      "Status for " + step.title
    );

    for (const entry of STEP_STATUSES) {
      const option = el(
        "option",
        entry.label
      );

      option.value = entry.id;
      select.appendChild(option);
    }

    select.value = step.status;

    select.addEventListener("change", () => {
      onChange(step.id, select.value);
    });

    label.appendChild(select);

    item.append(
      title,
      description,
      label
    );

    if (step.sourceIds.length) {
      const references = el(
        "small",
        "Source IDs: " +
        step.sourceIds.join(", ")
      );

      references.style.display = "block";
      references.style.marginTop = "8px";
      references.style.color = "#687587";

      item.appendChild(references);
    }

    section.appendChild(item);
  }

  container.appendChild(section);
}

function renderWarnings(container, workflow) {
  if (!workflow.warnings.length) return;

  const section = el("section", null, "card");
  section.style.marginBottom = "18px";

  section.appendChild(
    el("h3", "Legal considerations")
  );

  const list = el("ul");

  for (const warning of workflow.warnings) {
    const item = el("li", warning);
    item.style.marginBottom = "9px";
    list.appendChild(item);
  }

  section.appendChild(list);
  container.appendChild(section);
}

function renderSources(container, workflow) {
  const section = el("section", null, "card");

  section.appendChild(
    el("h3", "Official legal sources")
  );

  const description = el(
    "p",
    "Sources are provided for manual verification. " +
    "They have not been checked in real time.",
    "card-description"
  );

  section.appendChild(description);

  for (const source of workflow.sources) {
    if (
      typeof source.url !== "string" ||
      !source.url.startsWith("https://")
    ) {
      continue;
    }

    const item = el("div");
    item.style.margin = "14px 0";

    const link = el("a", source.title);
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    link.style.fontWeight = "650";

    const reference = el(
      "p",
      source.reference || source.id,
      "card-description"
    );

    reference.style.margin = "3px 0 0";

    item.append(link, reference);
    section.appendChild(item);
  }

  container.appendChild(section);
}

// ---------------------------------------------
// REPORT CONTROLLER
// ---------------------------------------------

function createReportController(
  context,
  reportContainer
) {
  let currentWorkflow = null;

  function show() {
    if (!currentWorkflow) return;

    reportContainer.replaceChildren();
    reportContainer.hidden = false;

    renderSummary(
      reportContainer,
      currentWorkflow
    );

    renderSteps(
      reportContainer,
      currentWorkflow,
      changeStep
    );

    renderWarnings(
      reportContainer,
      currentWorkflow
    );

    renderSources(
      reportContainer,
      currentWorkflow
    );

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
      () => downloadReport(currentWorkflow)
    );

    actions.appendChild(exportButton);

    const notice = el(
      "p",
      "Preliminary rule-based workflow only. " +
      "Human legal review is required before filing.",
      "card-description"
    );

    notice.style.marginTop = "15px";

    reportContainer.append(actions, notice);
  }

  function changeStep(stepId, status) {
    try {
      currentWorkflow = updateStepStatus(
        currentWorkflow,
        stepId,
        status
      );

      show();
    } catch (error) {
      context.reportError(
        error,
        "Corporate step update"
      );
    }
  }

  return {
    setWorkflow(workflow) {
      currentWorkflow = workflow;
      show();
    }
  };
}

// ---------------------------------------------
// MODULE ENTRY POINT
// ---------------------------------------------

export async function mount(context, container) {
  if (!container) {
    throw new Error(
      "Corporate module container is missing."
    );
  }

  const panel = el("section", null, "card");
  panel.style.marginTop = "24px";

  panel.appendChild(
    el("h2", "Corporate Governance")
  );

  const description = el(
    "p",
    "Prepare a preliminary Swiss corporate " +
    "registry workflow using structured " +
    "federal and cantonal legal data.",
    "card-description"
  );

  panel.appendChild(description);

  const form = el("form");
  form.style.marginTop = "22px";

  addField(
    form,
    "Company name",
    "companyName",
    {
      placeholder: "Example: Alpine Services SA"
    }
  );

  addField(
    form,
    "Person concerned",
    "personName",
    {
      placeholder: "Example: Marie Dupont"
    }
  );

  addField(
    form,
    "Company type",
    "companyType",
    {
      choices: COMPANY_TYPES
    }
  );

  addField(
    form,
    "Registered canton",
    "canton",
    {
      choices: CANTONS
    }
  );

  addField(
    form,
    "Type of change",
    "operation",
    {
      choices: OPERATIONS
    }
  );

  const submit = el(
    "button",
    "Generate legal workflow",
    "btn btn-primary"
  );

  submit.type = "submit";

  form.appendChild(submit);

  const privacyNotice = el(
    "p",
    "Demo mode: use fictional names and company data. " +
    "No information is intentionally transmitted to " +
    "a LexBridge server.",
    "card-description"
  );

  privacyNotice.style.marginTop = "12px";

  panel.append(form, privacyNotice);

  const report = el("section");
  report.style.marginTop = "24px";
  report.hidden = true;
  report.setAttribute("aria-live", "polite");

  const controller = createReportController(
    context,
    report
  );

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      submit.disabled = true;
      submit.textContent = "Generating workflow...";

      try {
        const matter = getMatter(form);

        const workflow =
          await createCorporateWorkflow(matter);

        controller.setWorkflow(workflow);

        context.setStatus(
          "Corporate workflow generated successfully.",
          "success"
        );

      } catch (error) {
        context.reportError(
          error,
          "Corporate workflow generation"
        );

        context.setStatus(
          "Corporate workflow generation failed.",
          "error"
        );

      } finally {
        submit.disabled = false;
        submit.textContent =
          "Generate legal workflow";
      }
    }
  );

  container.replaceChildren(panel, report);
}
