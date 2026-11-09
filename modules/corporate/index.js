
/**
 * LexBridge — Corporate Module Entry Point
 * Version: 0.4.0
 *
 * Connects:
 * - Corporate workflow form
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
 */
export async function mount(context, container) {
  if (!container) {
    throw new Error(
      "Corporate module container is missing."
    );
  }

  // ---------------------------------------
  // CORPORATE FORM
  // ---------------------------------------

  const panel = document.createElement("section");
  panel.className = "card";
  panel.style.marginTop = "24px";

  const heading = document.createElement("h2");
  heading.textContent = "Corporate Governance";

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent =
    "Prepare preliminary Swiss corporate registry " +
    "workflows using federal and cantonal legal data.";

  const { form, submitButton } =
    createCorporateForm();

  panel.append(heading, description, form);

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
  // SUBMIT CORPORATE WORKFLOW
  // ---------------------------------------

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      submitButton.disabled = true;
      submitButton.textContent =
        "Generating workflow...";

      // Prevent old document drafts from
      // remaining linked to a new case.
      documentController.clear();

      try {
        const matter = readCorporateMatter(form);

        const workflow =
          await createCorporateWorkflow(matter);

        reportController.setWorkflow(workflow);

        // Enable documents only for appointment.
        documentController.updateMatter(matter);

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
        submitButton.disabled = false;
        submitButton.textContent =
          "Generate legal workflow";
      }
    }
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
