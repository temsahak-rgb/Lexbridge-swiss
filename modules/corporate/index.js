
/**
 * LexBridge — Corporate Module Entry Point
 * Version: 0.7.0
 *
 * Features:
 * - Matter Wizard
 * - Independent report sections
 * - Paginated checklist
 * - Document Generator
 * - Non-destructive matter editing
 * - Compatible checklist status preservation
 */

"use strict";

import {
  createCorporateForm,
  readCorporateMatter
} from "./ui/form.js";

import {
  createMatterWizard
} from "./ui/matter-wizard.js";

import {
  createReportController
} from "./ui/report.js";

import {
  createCorporateSections
} from "./ui/corporate-sections.js";

import {
  createCorporateWorkflow
} from "./workflow-service.js";

import {
  createDocumentController
} from "./documents/document-controller.js";

import {
  updateStepStatus
} from "../../js/core/workflow-engine.js";

// ---------------------------------------------
// HELPERS
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

const MATTER_FIELDS = [
  "companyName",
  "companyType",
  "canton",
  "operation",
  "personName"
];

function normalize(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function sameMatter(a, b) {
  return MATTER_FIELDS.every(
    (field) => normalize(a?.[field]) ===
      normalize(b?.[field])
  );
}

function sameLegalScope(a, b) {
  return [
    "companyType",
    "canton",
    "operation"
  ].every(
    (field) => normalize(a?.[field]) ===
      normalize(b?.[field])
  );
}

function snapshotForm(form) {
  const data = new FormData(form);
  const values = {};

  for (const field of MATTER_FIELDS) {
    values[field] = String(
      data.get(field) ?? ""
    );
  }

  return values;
}

function restoreForm(form, values) {
  for (const field of MATTER_FIELDS) {
    const control = Array.from(
      form.elements
    ).find((item) => item.name === field);

    if (control && field in values) {
      control.value = values[field];
    }
  }
}

/**
 * Reapply compatible review statuses.
 *
 * This is allowed only when company type,
 * canton and operation are unchanged.
 *
 * Human review remains necessary.
 */
function preserveChecklist(oldWorkflow, newWorkflow) {
  const oldSteps = new Map(
    oldWorkflow.steps.map(
      (step) => [step.id, step]
    )
  );

  let workflow = newWorkflow;
  let preservedCount = 0;

  const allowedStatuses = new Set([
    "completed",
    "blocked",
    "not_applicable"
  ]);

  for (const step of newWorkflow.steps) {
    const previous = oldSteps.get(step.id);

    if (
      !previous ||
      !allowedStatuses.has(previous.status)
    ) {
      continue;
    }

    workflow = updateStepStatus(
      workflow,
      step.id,
      previous.status
    );

    preservedCount++;
  }

  return { workflow, preservedCount };
}

// ---------------------------------------------
// CORPORATE MODULE
// ---------------------------------------------

export async function mount(context, container) {
  if (!(container instanceof HTMLElement)) {
    throw new Error(
      "Corporate module container is missing."
    );
  }

  // MATTER WIZARD

  const matterPanel = el("section", null, "card");
  matterPanel.style.marginTop = "24px";

  const matterHeading = el(
    "h2",
    "New Corporate Matter"
  );

  const matterDescription = el(
    "p",
    "Enter or edit the case information. " +
    "Existing review progress will be retained " +
    "where compatible.",
    "card-description"
  );

  const cancelButton = el(
    "button",
    "Cancel Editing",
    "btn btn-secondary"
  );

  cancelButton.type = "button";
  cancelButton.hidden = true;
  cancelButton.style.marginBottom = "18px";

  const { form, submitButton } =
    createCorporateForm();

  const matterWizard =
    createMatterWizard(form, submitButton);

  matterPanel.append(
    matterHeading,
    matterDescription,
    cancelButton,
    form
  );

  // REPORT CONTROLLER

  const reportHost = el("div");
  reportHost.hidden = true;

  const reportController =
    createReportController(context, reportHost);

  const reportSections =
    reportController.getSections();

  // DOCUMENT CONTROLLER

  const documentContainer = el("section");
  documentContainer.hidden = true;

  const documentController =
    createDocumentController(
      context,
      documentContainer,
      null
    );

  // SECTION NAVIGATION

  const sectionNavigator =
    createCorporateSections();

  sectionNavigator.mountSection(
    "workflow",
    reportSections.workflow
  );

  sectionNavigator.mountSection(
    "warnings",
    reportSections.warnings
  );

  sectionNavigator.mountSection(
    "sources",
    reportSections.sources
  );

  sectionNavigator.mountSection(
    "documents",
    documentContainer
  );

  sectionNavigator.setSectionEnabled(
    "documents",
    false
  );

  // REPORT WORKSPACE

  const workspace = el(
    "section",
    null,
    "lb-corporate-workspace"
  );

  workspace.style.marginTop = "24px";
  workspace.hidden = true;

  const workspaceHeader = el(
    "div",
    null,
    "lb-page-header"
  );

  const workspaceTitle = el(
    "h2",
    "Corporate Matter"
  );

  const workspaceDescription = el(
    "p",
    "Review your workflow, legal considerations, " +
    "official sources and documents.",
    "card-description"
  );

  const editButton = el(
    "button",
    "Edit Matter Details",
    "btn btn-secondary"
  );

  editButton.type = "button";
  editButton.style.marginTop = "12px";

  workspaceHeader.append(
    workspaceTitle,
    workspaceDescription,
    editButton
  );

  workspace.append(
    workspaceHeader,
    sectionNavigator.element
  );

  // EDITING STATE

  let savedFormValues = null;
  let savedMatter = null;

  function showWorkspace() {
    matterPanel.hidden = true;
    workspace.hidden = false;
    cancelButton.hidden = true;

    workspace.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  editButton.addEventListener("click", () => {
    savedFormValues = snapshotForm(form);

    matterHeading.textContent =
      "Edit Corporate Matter";

    cancelButton.hidden = false;
    workspace.hidden = true;
    matterPanel.hidden = false;

    matterPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  cancelButton.addEventListener("click", () => {
    if (savedFormValues) {
      restoreForm(form, savedFormValues);
    }

    showWorkspace();
  });

  // WORKFLOW SUBMISSION

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const previousWorkflow =
        reportController.getWorkflow();

      let matter;

      try {
        matter = readCorporateMatter(form);
      } catch (error) {
        context.reportError(
          error,
          "Matter validation"
        );
        return;
      }

      // No changes: keep the existing workflow
      // and every checklist status untouched.
      if (
        previousWorkflow &&
        savedMatter &&
        sameMatter(savedMatter, matter)
      ) {
        showWorkspace();

        context.setStatus(
          "No changes detected. Existing review retained.",
          "success"
        );

        return;
      }

      const compatible = Boolean(
        previousWorkflow &&
        savedMatter &&
        sameLegalScope(savedMatter, matter)
      );

      // A different legal scope requires
      // a fresh review.
      if (
        previousWorkflow &&
        !compatible
      ) {
        const approved = window.confirm(
          "Company type, canton or operation has changed.\n\n" +
          "A new legal workflow will be generated and " +
          "previous checklist statuses will not be reused.\n\n" +
          "Continue? The existing report will remain " +
          "available if you cancel."
        );

        if (!approved) {
          return;
        }
      }

      submitButton.disabled = true;
      submitButton.textContent =
        "Updating workflow...";

      try {
        let nextWorkflow =
          await createCorporateWorkflow(matter);

        let preservedCount = 0;

        // Reuse matching checklist statuses
        // if legal scope is unchanged.
        if (compatible) {
          const result = preserveChecklist(
            previousWorkflow,
            nextWorkflow
          );

          nextWorkflow = result.workflow;
          preservedCount = result.preservedCount;

          // Explicitly flag information changes
          // requiring renewed human verification.
          const warnings = Array.isArray(
            nextWorkflow.warnings
          )
            ? [...nextWorkflow.warnings]
            : [];

          warnings.push(
            "Matter details were edited. " +
            "Compatible checklist statuses were carried " +
            "forward, but previously reviewed items " +
            "must be rechecked against the updated facts."
          );

          nextWorkflow.warnings = warnings;
        }

        // Commit only after successful generation.
        reportController.setWorkflow(
          nextWorkflow
        );

        // Invalidate drafts linked to earlier facts.
        documentController.clear();
        documentController.updateMatter(matter);

        savedMatter = { ...matter };
        savedFormValues = snapshotForm(form);

        sectionNavigator.setSectionEnabled(
          "documents",
          matter.operation === "appoint"
        );

        sectionNavigator.reset();
        sectionNavigator.showSection("workflow");

        workspaceTitle.textContent =
          matter.companyName || "Corporate Matter";

        matterHeading.textContent =
          "Edit Corporate Matter";

        showWorkspace();

        context.setStatus(
          preservedCount > 0
            ? `${preservedCount} review statuses preserved. ` +
              "Recheck them against the updated information."
            : "Corporate workflow generated successfully.",
          preservedCount > 0 ? "warning" : "success"
        );

      } catch (error) {
        context.reportError(
          error,
          "Corporate workflow generation"
        );

        context.setStatus(
          "Workflow update failed. " +
          "The previous report has been retained.",
          "error"
        );

      } finally {
        submitButton.disabled = false;
        submitButton.textContent =
          "Generate legal workflow";
      }
    }
  );

  // INITIAL MOUNT

  container.replaceChildren(
    matterPanel,
    workspace
  );
}
