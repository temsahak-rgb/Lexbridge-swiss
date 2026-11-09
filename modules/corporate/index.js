
/**
 * LexBridge — Corporate Module Entry Point
 * Version: 0.8.0
 *
 * Features:
 * - Multilingual matter management (EN / FR / DE)
 * - Matter Wizard
 * - Independent report sections
 * - Paginated checklist
 * - Document Generator
 * - Non-destructive matter editing
 * - Compatible checklist status preservation
 * - Language changes never regenerate workflows
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

import {
  t,
  onLanguageChange
} from "../../js/core/i18n.js";

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
    (field) =>
      normalize(a?.[field]) ===
      normalize(b?.[field])
  );
}

function sameLegalScope(a, b) {
  return [
    "companyType",
    "canton",
    "operation"
  ].every(
    (field) =>
      normalize(a?.[field]) ===
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
  if (!values) return;

  for (const field of MATTER_FIELDS) {
    const control = Array.from(
      form.elements
    ).find((item) => item.name === field);

    if (
      control &&
      Object.prototype.hasOwnProperty.call(
        values,
        field
      )
    ) {
      control.value = values[field];
    }
  }
}

/**
 * Preserve checklist statuses only when
 * company type, canton and operation
 * remain unchanged.
 *
 * Step IDs are never translated.
 */
function preserveChecklist(
  oldWorkflow,
  newWorkflow
) {
  const oldSteps = new Map(
    (oldWorkflow.steps || []).map(
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

  for (const step of newWorkflow.steps || []) {
    const previous = oldSteps.get(
      step.id
    );

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

  return {
    workflow,
    preservedCount
  };
}

// ---------------------------------------------
// CORPORATE MODULE
// ---------------------------------------------

export async function mount(
  context,
  container
) {
  if (!(container instanceof HTMLElement)) {
    throw new Error(
      "Corporate module container is missing."
    );
  }

  // -------------------------------------------
  // MATTER WIZARD
  // -------------------------------------------

  const matterPanel = el(
    "section",
    null,
    "card"
  );

  matterPanel.style.marginTop = "24px";

  const matterHeading = el("h2");

  const matterDescription = el(
    "p",
    "",
    "card-description"
  );

  const cancelButton = el(
    "button",
    "",
    "btn btn-secondary"
  );

  cancelButton.type = "button";
  cancelButton.hidden = true;
  cancelButton.style.marginBottom = "18px";

  const {
    form,
    submitButton
  } = createCorporateForm();

  // Existing wizard stays mounted.
  createMatterWizard(
    form,
    submitButton
  );

  matterPanel.append(
    matterHeading,
    matterDescription,
    cancelButton,
    form
  );

  // -------------------------------------------
  // REPORT CONTROLLER
  // -------------------------------------------

  const reportHost = el("div");
  reportHost.hidden = true;

  const reportController =
    createReportController(
      context,
      reportHost
    );

  const reportSections =
    reportController.getSections();

  // -------------------------------------------
  // DOCUMENT CONTROLLER
  // -------------------------------------------

  const documentContainer = el("section");
  documentContainer.hidden = true;

  const documentController =
    createDocumentController(
      context,
      documentContainer,
      null
    );

  // -------------------------------------------
  // SECTION NAVIGATION
  // -------------------------------------------

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

  // -------------------------------------------
  // REPORT WORKSPACE
  // -------------------------------------------

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

  const workspaceTitle = el("h2");

  const workspaceDescription = el(
    "p",
    "",
    "card-description"
  );

  const editButton = el(
    "button",
    "",
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

  // -------------------------------------------
  // STATE
  // -------------------------------------------

  let savedFormValues = null;
  let savedMatter = null;

  let isEditing = false;
  let isSubmitting = false;

  // -------------------------------------------
  // LIVE TRANSLATION
  // -------------------------------------------

  /**
   * Translate only the elements owned
   * by this module.
   *
   * Do not recreate the form, wizard,
   * workflow, checklist or documents.
   */
  function updateTranslations() {
    matterHeading.textContent =
      isEditing
        ? t("corporate.editMatter")
        : t("corporate.newMatter");

    matterDescription.textContent =
      t("corporate.matterEditDescription");

    cancelButton.textContent =
      t("corporate.cancelEditing");

    workspaceTitle.textContent =
      savedMatter?.companyName ||
      t("corporate.matterTitle");

    workspaceDescription.textContent =
      t("corporate.reviewDescription");

    editButton.textContent =
      t("corporate.editMatterDetails");

    // The form.js translation listener
    // updates ordinary submit labels.
    // Here we only manage the busy state.
    if (isSubmitting) {
      submitButton.textContent =
        t("corporate.updatingWorkflow");
    }
  }

  const unsubscribeLanguage =
    onLanguageChange(
      updateTranslations
    );

  // -------------------------------------------
  // NAVIGATION BETWEEN EDIT / REPORT
  // -------------------------------------------

  function showWorkspace() {
    isEditing = false;

    matterPanel.hidden = true;
    workspace.hidden = false;
    cancelButton.hidden = true;

    updateTranslations();

    workspace.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function showMatterEditor() {
    savedFormValues = snapshotForm(form);

    isEditing = true;

    cancelButton.hidden = false;
    workspace.hidden = true;
    matterPanel.hidden = false;

    updateTranslations();

    matterPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  editButton.addEventListener(
    "click",
    showMatterEditor
  );

  cancelButton.addEventListener(
    "click",
    () => {
      if (isSubmitting) return;

      restoreForm(
        form,
        savedFormValues
      );

      showWorkspace();
    }
  );

  // -------------------------------------------
  // WORKFLOW SUBMISSION
  // -------------------------------------------

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (isSubmitting) {
        return;
      }

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

      // ---------------------------------------
      // UNCHANGED MATTER
      // ---------------------------------------

      if (
        previousWorkflow &&
        savedMatter &&
        sameMatter(savedMatter, matter)
      ) {
        showWorkspace();

        context.setStatus(
          t("corporate.noChanges"),
          "success"
        );

        return;
      }

      // ---------------------------------------
      // LEGAL SCOPE COMPATIBILITY
      // ---------------------------------------

      const compatible = Boolean(
        previousWorkflow &&
        savedMatter &&
        sameLegalScope(
          savedMatter,
          matter
        )
      );

      // Different legal scope means that
      // checklist statuses cannot be reused.
      if (
        previousWorkflow &&
        !compatible
      ) {
        const message =
          t("validation.confirmScopeChange") +
          "\n\n" +
          t("validation.confirmScopeChangeAction");

        const approved =
          window.confirm(message);

        if (!approved) {
          return;
        }
      }

      // ---------------------------------------
      // START GENERATION
      // ---------------------------------------

      isSubmitting = true;

      submitButton.disabled = true;
      cancelButton.disabled = true;

      submitButton.textContent =
        t("corporate.updatingWorkflow");

      try {
        let nextWorkflow =
          await createCorporateWorkflow(
            matter
          );

        let preservedCount = 0;

        // -------------------------------------
        // PRESERVE COMPATIBLE REVIEW STATUS
        // -------------------------------------

        if (compatible) {
          const result = preserveChecklist(
            previousWorkflow,
            nextWorkflow
          );

          nextWorkflow = result.workflow;

          preservedCount =
            result.preservedCount;

          // A changed matter must still
          // receive human legal verification.
          const warnings = Array.isArray(
            nextWorkflow.warnings
          )
            ? [...nextWorkflow.warnings]
            : [];

          warnings.push(
            t("workflow.reviewNeedsChecking")
          );

          nextWorkflow.warnings = warnings;
        }

        // -------------------------------------
        // COMMIT SUCCESSFUL GENERATION
        // -------------------------------------

        reportController.setWorkflow(
          nextWorkflow
        );

        // Existing drafts may refer to old
        // facts. Invalidate those drafts.
        documentController.clear();

        documentController.updateMatter(
          matter
        );

        savedMatter = { ...matter };
        savedFormValues = snapshotForm(
          form
        );

        sectionNavigator.setSectionEnabled(
          "documents",
          matter.operation === "appoint"
        );

        sectionNavigator.reset();

        sectionNavigator.showSection(
          "workflow"
        );

        showWorkspace();

        // -------------------------------------
        // LOCALIZED STATUS MESSAGE
        // -------------------------------------

        if (preservedCount > 0) {
          context.setStatus(
            `${preservedCount} — ` +
            t("workflow.reviewRetained") +
            " " +
            t("workflow.reviewNeedsChecking"),
            "warning"
          );
        } else {
          context.setStatus(
            t("workflow.generated"),
            "success"
          );
        }

      } catch (error) {
        context.reportError(
          error,
          "Corporate workflow generation"
        );

        context.setStatus(
          t("status.updateFailed"),
          "error"
        );

      } finally {
        isSubmitting = false;

        submitButton.disabled = false;
        cancelButton.disabled = false;

        submitButton.textContent =
          t("corporate.generateWorkflow");
      }
    }
  );

  // -------------------------------------------
  // INITIAL MOUNT
  // -------------------------------------------

  container.replaceChildren(
    matterPanel,
    workspace
  );

  updateTranslations();

  // Keep a reference to the unsubscribe
  // callback for future module lifecycle work.
  // It does not affect the current module API.
  void unsubscribeLanguage;
}
