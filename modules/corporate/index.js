
/**
 * LexBridge — Corporate Module Entry Point
 * Version: 0.3.0
 *
 * Connects independent UI and workflow services.
 * No legal rules or detailed UI rendering here.
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

/**
 * Called by LexBridge Module Loader.
 *
 * @param {object} context Shared application context.
 * @param {HTMLElement} container Corporate module container.
 */
export async function mount(context, container) {
  if (!container) {
    throw new Error("Corporate module container is missing.");
  }

  // Main module panel
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

  // Independent form component
  const { form, submitButton } =
    createCorporateForm();

  // Independent report component
  const reportContainer = document.createElement("section");
  reportContainer.style.marginTop = "24px";
  reportContainer.hidden = true;
  reportContainer.setAttribute("aria-live", "polite");

  const reportController =
    createReportController(context, reportContainer);

  // Connect form to workflow service
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = "Generating workflow...";

    try {
      const matter = readCorporateMatter(form);

      const workflow =
        await createCorporateWorkflow(matter);

      reportController.setWorkflow(workflow);

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
      submitButton.textContent = "Generate legal workflow";
    }
  });

  panel.append(heading, description, form);

  // Mount independent components
  container.replaceChildren(panel, reportContainer);
}
