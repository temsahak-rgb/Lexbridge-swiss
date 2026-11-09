
/**
 * LexBridge — Corporate Module Entry Point
 * Version: 0.5.0
 *
 * Connects:
 * - Corporate Matter Wizard
 * - Legal workflow service
 * - Workflow report
 * - Document generator
 *
 * No legal rules or document templates here.
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
  createCorporateWorkflow
} from "./workflow-service.js";

import {
  createDocumentController
} from "./documents/document-controller.js";

/**
 * Called by the LexBridge Module Loader.
 *
 * @param {object} context Shared application context.
 * @param {HTMLElement} container Corporate module container.
 */
export async function mount(context, container) {
  if (!(container instanceof HTMLElement)) {
    throw new Error(
      "Corporate module container is missing."
    );
  }

  // ---------------------------------------
  // MATTER FORM
  // ---------------------------------------

  const panel = document.createElement("section");
  panel.className = "card";
  panel.style.marginTop = "24px";

  const heading = document.createElement("h2");
  heading.textContent = "New Corporate Matter";

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent =
    "Enter the company information step by step. " +
    "You can return to earlier steps without " +
    "losing your entries.";

  const { form, submitButton } =
    createCorporateForm();

  // ---------------------------------------
  // WORKFLOW REPORT
  // ---------------------------------------

  const reportContainer =
    document.createElement("section");

  reportContainer.style.marginTop = "24px";
  reportContainer.hidden = true;

  reportContainer.setAttribute(
    "aria-live",
    "polite"
  );

  const reportController =
    createReportController(
      context,
      reportContainer
    );

  // ---------------------------------------
  // DOCUMENT GENERATOR
  // ---------------------------------------

  const documentContainer =
    document.createElement("section");

  documentContainer.style.marginTop = "24px";
  documentContainer.hidden = true;

  const documentController =
    createDocumentController(
      context,
      documentContainer,
      null
    );

  // ---------------------------------------
  // WORKFLOW SUBMISSION
  // ---------------------------------------

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      submitButton.disabled = true;
      submitButton.textContent =
        "Generating workflow...";

      documentController.clear();

      try {
        const matter =
          readCorporateMatter(form);

        const workflow =
          await createCorporateWorkflow(matter);

        reportController.setWorkflow(
          workflow
        );

        // Appointment documents only.
        documentController.updateMatter(
          matter
        );

        context.setStatus(
          "Corporate workflow generated. " +
          "Review the legal checklist below.",
          "success"
        );

        // Bring the generated report into view.
        reportContainer.scrollIntoView({
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

  // ---------------------------------------
  // ACTIVATE MATTER WIZARD
  // ---------------------------------------

  const matterWizard =
    createMatterWizard(
      form,
      submitButton
    );

  // Preserve a reference for future navigation.
  panel.dataset.component = "matter-wizard";

  panel.append(
    heading,
    description,
    form
  );

  // ---------------------------------------
  // MOUNT COMPONENTS
  // ---------------------------------------

  container.replaceChildren(
    panel,
    reportContainer,
    documentContainer
  );
}
