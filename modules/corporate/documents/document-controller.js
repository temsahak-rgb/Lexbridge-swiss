
/**
 * LexBridge — Corporate Document Controller
 * Version: 0.1.0
 *
 * Coordinates the document form, document service
 * and draft preview without changing the core engine.
 *
 * No API, no backend, no external dependencies.
 */

"use strict";

import {
  createDocumentForm,
  readDocumentDetails
} from "./ui/document-form.js";

import {
  renderDocumentPreview
} from "./ui/document-preview.js";

import {
  createCorporateDocument
} from "./document-service.js";

// ------------------------------------------------
// DATE FORMATTING
// ------------------------------------------------

/**
 * Convert an ISO date (YYYY-MM-DD) into a
 * language-appropriate Swiss document date.
 *
 * Uses UTC to avoid timezone-related date shifts.
 */
function formatDate(value, language) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return value || "";
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid document date.");
  }

  const locale =
    language === "de" ? "de-CH" : "fr-CH";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

// ------------------------------------------------
// CONTROLLER
// ------------------------------------------------

/**
 * Create an independent document generator.
 *
 * @param {object} context Shared LexBridge context.
 * @param {HTMLElement} container Mounting point.
 * @param {object} matter Corporate case data.
 *
 * @returns {object} Controller with updateMatter().
 */
export function createDocumentController(
  context,
  container,
  matter
) {
  if (!container) {
    throw new Error(
      "Document generator container is missing."
    );
  }

  let currentMatter = matter || null;
  let latestDocument = null;

  const panel = document.createElement("section");
  panel.className = "card";
  panel.style.marginTop = "20px";

  const heading = document.createElement("h3");
  heading.textContent = "Document Generator";

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent =
    "Prepare a preliminary mandate acceptance " +
    "declaration in French or German.";

  const { form, submitButton } = createDocumentForm();

  const previewContainer =
    document.createElement("section");

  previewContainer.hidden = true;
  previewContainer.setAttribute(
    "aria-live",
    "polite"
  );

  panel.append(heading, description, form);
  container.append(panel, previewContainer);

  function clearPreview() {
    latestDocument = null;
    previewContainer.replaceChildren();
    previewContainer.hidden = true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent =
      "Generating document...";

    try {
      if (!currentMatter) {
        throw new Error(
          "Generate a corporate workflow first."
        );
      }

      if (currentMatter.operation !== "appoint") {
        throw new Error(
          "Mandate acceptance templates are available " +
          "only for appointment workflows."
        );
      }

      const { templateId, details } =
        readDocumentDetails(form);

      const language = templateId.endsWith("-de")
        ? "de"
        : "fr";

      const formattedDetails = {
        ...details,
        appointmentDate: formatDate(
          details.appointmentDate,
          language
        ),
        documentDate: formatDate(
          details.documentDate,
          language
        )
      };

      const documentDraft =
        await createCorporateDocument({
          templateId,
          matter: currentMatter,
          details: formattedDetails
        });

      latestDocument = documentDraft;

      const preview = renderDocumentPreview(
        documentDraft,
        context.reportError
      );

      previewContainer.replaceChildren(preview);
      previewContainer.hidden = false;

      context.setStatus(
        documentDraft.status === "incomplete"
          ? "Document draft generated with missing information."
          : "Document draft generated. Human review required.",
        documentDraft.status === "incomplete"
          ? "info"
          : "success"
      );

    } catch (error) {
      context.reportError(
        error,
        "Corporate document generation"
      );

      context.setStatus(
        "Document generation failed.",
        "error"
      );

    } finally {
      submitButton.disabled = false;
      submitButton.textContent =
        "Generate document draft";
    }
  }

  form.addEventListener("submit", handleSubmit);

  return {
    /**
     * Update the currently selected case.
     * Clear documents to prevent stale matter data.
     */
    updateMatter(nextMatter) {
      currentMatter = nextMatter || null;
      clearPreview();

      container.hidden = !(
        currentMatter &&
        currentMatter.operation === "appoint"
      );
    },

    getDocument() {
      return latestDocument;
    },

    clear() {
      currentMatter = null;
      clearPreview();
      container.hidden = true;
    }
  };
}
