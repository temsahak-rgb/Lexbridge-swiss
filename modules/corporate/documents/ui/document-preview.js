
/**
 * LexBridge — Corporate Document Preview
 * Version: 0.1.0
 *
 * Renders a generated plain-text document.
 * Provides copy, TXT download and print actions.
 * Does not perform legal validation.
 */

"use strict";

import {
  corporateDocumentToText
} from "../document-service.js";

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

function downloadText(filename, contents) {
  const blob = new Blob([contents], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(value) {
  return String(value || "document")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "document";
}

function renderMissingFields(document) {
  const missing = Array.isArray(document.missingFields)
    ? document.missingFields
    : [];

  if (missing.length === 0) {
    return el(
      "p",
      "All declared template fields are present. " +
      "This does not confirm legal completeness.",
      "card-description"
    );
  }

  const section = el("div");

  const heading = el(
    "h4",
    "Missing information"
  );

  heading.style.color =
    "var(--color-danger, #a52727)";

  const list = el("ul");

  missing.forEach((field) => {
    list.appendChild(el("li", field));
  });

  section.append(heading, list);
  return section;
}

/**
 * Returns a document preview element.
 *
 * @param {Object} document Generated draft.
 * @param {Function} reportError Optional error callback.
 */
export function renderDocumentPreview(
  document,
  reportError = console.error
) {
  if (
    !document ||
    typeof document.content !== "string"
  ) {
    throw new Error(
      "Invalid document supplied to preview."
    );
  }

  const section = el("section", null, "card");
  section.classList.add("document-preview");
  section.style.marginTop = "20px";

  const heading = el(
    "h3",
    document.title || "Document draft"
  );

  const status = el(
    "p",
    "Status: " + (document.status || "draft"),
    "status-badge status-warning"
  );

  const metadata = el(
    "p",
    [
      "Language: " + (document.language || "unknown"),
      "Template: " + (document.templateId || document.id)
    ].join(" · "),
    "card-description"
  );

  const notice = el(
    "p",
    "DRAFT — NOT VALIDATED FOR FILING",
    "status-badge status-danger"
  );

  const text = el(
    "pre",
    document.content
  );

  text.style.whiteSpace = "pre-wrap";
  text.style.overflowWrap = "anywhere";
  text.style.fontFamily =
    "Georgia, 'Times New Roman', serif";
  text.style.lineHeight = "1.8";
  text.style.padding = "22px";
  text.style.background = "#fafbfc";
  text.style.border =
    "1px solid var(--color-border, #dfe4eb)";
  text.style.borderRadius = "10px";

  const missing = renderMissingFields(document);

  const requirements = el("div");
  requirements.style.marginTop = "18px";

  if (Array.isArray(document.reviewRequirements) &&
      document.reviewRequirements.length > 0) {
    requirements.appendChild(
      el("h4", "Human review checklist")
    );

    const list = el("ul");

    document.reviewRequirements.forEach((item) => {
      list.appendChild(el("li", item));
    });

    requirements.appendChild(list);
  }

  const actions = el("div");
  actions.className = "flex-row";
  actions.style.flexWrap = "wrap";
  actions.style.marginTop = "20px";

  const copyButton = el(
    "button",
    "Copy text",
    "btn btn-secondary"
  );

  copyButton.type = "button";

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(
        corporateDocumentToText(document)
      );

      copyButton.textContent = "Copied!";

      setTimeout(() => {
        copyButton.textContent = "Copy text";
      }, 1500);

    } catch (error) {
      reportError(error, "Document copy");
    }
  });

  const downloadButton = el(
    "button",
    "Download TXT",
    "btn btn-secondary"
  );

  downloadButton.type = "button";

  downloadButton.addEventListener("click", () => {
    try {
      downloadText(
        safeFilename(document.title) + ".txt",
        corporateDocumentToText(document)
      );
    } catch (error) {
      reportError(error, "Document download");
    }
  });

  const printButton = el(
    "button",
    "Print / Save PDF",
    "btn btn-secondary"
  );

  printButton.type = "button";

  printButton.addEventListener("click", () => {
    try {
      window.print();
    } catch (error) {
      reportError(error, "Document print");
    }
  });

  actions.append(
    copyButton,
    downloadButton,
    printButton
  );

  const disclaimer = el(
    "p",
    document.legalNotice ||
      document.disclaimer ||
      "Automatically prepared draft; human review required.",
    "card-description"
  );

  disclaimer.style.marginTop = "18px";

  section.append(
    heading,
    status,
    metadata,
    notice,
    text,
    missing,
    requirements,
    actions,
    disclaimer
  );

  return section;
}
