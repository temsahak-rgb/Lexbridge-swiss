
/**
 * LexBridge — Corporate Module Entry Point
 * Version: 0.6.0
 *
 * Features:
 * - Four-step Matter Wizard
 * - Independent Corporate sections
 * - Paginated legal checklist
 * - Legal considerations
 * - Official legal sources
 * - Document Generator
 *
 * Framework-free ES module.
 * No legal rules or templates in this file.
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

// ---------------------------------------------
// MODULE ENTRY POINT
// ---------------------------------------------

export async function mount(context, container) {
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

  matterPanel.append(
    el("h2", "New Corporate Matter"),
    el(
      "p",
      "Enter the company information step by step. " +
      "You can return to earlier steps without " +
      "losing your entries.",
      "card-description"
    )
  );

  const { form, submitButton } =
    createCorporateForm();

  createMatterWizard(
    form,
    submitButton
  );

  matterPanel.appendChild(form);

  // -------------------------------------------
  // REPORT CONTROLLER
  // -------------------------------------------

  /*
   * The report controller creates independent
   * sections inside this temporary container.
   *
   * The section navigator will move those
   * elements into separate pages.
   */

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

  // Document templates currently support
  // appointment workflows only.
  sectionNavigator.setSectionEnabled(
    "documents",
    false
  );

  const workspace = el(
    "section",
    null,
    "lb-corporate-workspace"
  );

  workspace.style.marginTop = "24px";
  workspace.hidden = true;

  // -------------------------------------------
  // WORKSPACE HEADER
  // -------------------------------------------

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
    "Review the workflow, legal considerations, " +
    "official sources and available documents.",
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

  // -------------------------------------------
  // EDIT MATTER
  // -------------------------------------------

  editButton.addEventListener(
    "click",
    () => {
      workspace.hidden = true;
      matterPanel.hidden = false;

      matterPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  );

  // -------------------------------------------
  // WORKFLOW SUBMISSION
  // -------------------------------------------

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      submitButton.disabled = true;
      submitButton.textContent =
        "Generating workflow...";

      try {
        const matter =
          readCorporateMatter(form);

        const workflow =
          await createCorporateWorkflow(matter);

        // Replace the active legal report.
        reportController.setWorkflow(
          workflow
        );

        // Clear outdated document drafts
        // before linking the new matter.
        documentController.clear();

        documentController.updateMatter(
          matter
        );

        // Documents only for appointments.
        const documentsAvailable =
          matter.operation === "appoint";

        sectionNavigator.setSectionEnabled(
          "documents",
          documentsAvailable
        );

        // Show the first report page.
        sectionNavigator.reset();
        sectionNavigator.showSection(
          "workflow"
        );

        workspaceTitle.textContent =
          matter.companyName ||
          "Corporate Matter";

        // Hide matter form and display
        // the independent report pages.
        matterPanel.hidden = true;
        workspace.hidden = false;

        context.setStatus(
          "Corporate workflow generated. " +
          "You can now review each section.",
          "success"
        );

        workspace.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

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
        submitButton.disabled = false;
        submitButton.textContent =
          "Generate legal workflow";
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
}
