
/**
 * LexBridge — Corporate Legal Sources UI
 * Version: 0.3.0
 *
 * Displays official federal and cantonal references.
 * No network requests, no legal interpretation.
 */

"use strict";

/**
 * Create a safe text-only DOM element.
 */
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
 * Accept only properly formed HTTPS links.
 */
function safeHttpsURL(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return null;
    }

    // Avoid credentials embedded inside URLs.
    if (url.username || url.password) {
      return null;
    }

    return url.href;

  } catch {
    return null;
  }
}

/**
 * Render a list of legal sources.
 *
 * @param {Object} workflow Generated workflow.
 * @returns {HTMLElement} Sources section.
 */
export function renderSources(workflow) {
  if (!workflow || !Array.isArray(workflow.sources)) {
    throw new Error(
      "Invalid workflow data supplied to sources UI."
    );
  }

  const section = element(
    "section",
    null,
    "card"
  );

  section.classList.add("legal-sources");
  section.style.marginBottom = "18px";

  section.appendChild(
    element("h3", "Official legal sources")
  );

  section.appendChild(
    element(
      "p",
      "The following sources are provided for " +
      "manual verification. LexBridge does not " +
      "automatically confirm that a legal source " +
      "is current or applicable.",
      "card-description"
    )
  );

  if (workflow.sources.length === 0) {
    section.appendChild(
      element(
        "p",
        "No legal sources are available.",
        "card-description"
      )
    );

    return section;
  }

  const list = element("div");
  list.className = "legal-source-list";

  for (const source of workflow.sources) {
    if (!source || typeof source !== "object") {
      continue;
    }

    const url = safeHttpsURL(source.url);

    const item = element(
      "article",
      null,
      "legal-source-item"
    );

    item.style.padding = "14px 0";
    item.style.borderBottom =
      "1px solid var(--color-border, #dfe4eb)";

    const title = url
      ? element("a", source.title || source.id)
      : element("span", source.title || source.id);

    if (url) {
      title.href = url;
      title.target = "_blank";
      title.rel = "noopener noreferrer";
    }

    title.style.fontWeight = "650";

    item.appendChild(title);

    if (source.reference) {
      const reference = element(
        "p",
        source.reference,
        "card-description"
      );

      reference.style.margin = "5px 0 0";
      item.appendChild(reference);
    }

    if (source.verifiedAt) {
      const verification = element(
        "small",
        "Dataset review date: " + source.verifiedAt
      );

      verification.style.display = "block";
      verification.style.marginTop = "6px";
      verification.style.color =
        "var(--color-text-muted, #687587)";

      item.appendChild(verification);
    }

    if (!url) {
      const warning = element(
        "small",
        "No valid HTTPS link available."
      );

      warning.style.display = "block";
      warning.style.marginTop = "6px";
      warning.style.color =
        "var(--color-danger, #a52727)";

      item.appendChild(warning);
    }

    list.appendChild(item);
  }

  section.appendChild(list);

  return section;
}
