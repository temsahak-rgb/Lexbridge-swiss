
/**
 * LexBridge — Corporate Section Navigator
 * Version: 0.1.0
 *
 * Separates Corporate reports into pages:
 * - Workflow
 * - Legal Considerations
 * - Official Sources
 * - Documents
 *
 * Preserves mounted elements and form state.
 *
 * No legal logic or external dependencies.
 */

"use strict";

const SECTIONS = Object.freeze([
  {
    id: "workflow",
    title: "Workflow",
    description: "Overview and legal checklist"
  },
  {
    id: "warnings",
    title: "Legal Considerations",
    description: "Warnings requiring human review"
  },
  {
    id: "sources",
    title: "Official Legal Sources",
    description: "Federal and cantonal references"
  },
  {
    id: "documents",
    title: "Document Generator",
    description: "Prepare document drafts"
  }
]);

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

/**
 * Create a navigator for Corporate sections.
 *
 * Content is mounted independently using
 * mountSection(id, element).
 *
 * Moving an existing element preserves its
 * inputs, event listeners and current state.
 */
export function createCorporateSections() {
  const root = el(
    "section",
    null,
    "lb-corporate-sections"
  );

  const navigation = el(
    "nav",
    null,
    "lb-steps"
  );

  navigation.setAttribute(
    "aria-label",
    "Corporate workspace sections"
  );

  const content = el(
    "div",
    null,
    "lb-corporate-section-content"
  );

  const buttons = new Map();
  const panels = new Map();

  let activeSection = "workflow";

  // -----------------------------------------
  // BUILD NAVIGATION AND PANELS
  // -----------------------------------------

  for (const section of SECTIONS) {
    const button = el(
      "button",
      section.title,
      "lb-step"
    );

    button.type = "button";
    button.dataset.section = section.id;
    button.disabled = true;

    const panel = el(
      "section",
      null,
      "lb-section-panel"
    );

    panel.dataset.section = section.id;
    panel.hidden = true;

    const heading = el(
      "h2",
      section.title,
      "lb-panel-title"
    );

    const description = el(
      "p",
      section.description,
      "lb-help-text"
    );

    panel.append(heading, description);

    button.setAttribute(
      "aria-controls",
      "lb-section-" + section.id
    );

    panel.id = "lb-section-" + section.id;

    button.addEventListener(
      "click",
      () => showSection(section.id)
    );

    buttons.set(section.id, button);
    panels.set(section.id, panel);

    navigation.appendChild(button);
    content.appendChild(panel);
  }

  root.append(navigation, content);

  // -----------------------------------------
  // UPDATE NAVIGATION
  // -----------------------------------------

  function refresh() {
    for (const section of SECTIONS) {
      const button = buttons.get(section.id);
      const panel = panels.get(section.id);

      const active =
        section.id === activeSection;

      button.classList.toggle(
        "is-current",
        active
      );

      button.setAttribute(
        "aria-selected",
        String(active)
      );

      if (active) {
        button.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        button.removeAttribute(
          "aria-current"
        );
      }

      panel.hidden = !active;
    }
  }

  // -----------------------------------------
  // SHOW A SECTION
  // -----------------------------------------

  function showSection(sectionId) {
    const button = buttons.get(sectionId);

    if (!button || button.disabled) {
      return false;
    }

    activeSection = sectionId;
    refresh();

    return true;
  }

  // -----------------------------------------
  // MOUNT CONTENT
  // -----------------------------------------

  function mountSection(sectionId, element) {
    const panel = panels.get(sectionId);
    const button = buttons.get(sectionId);

    if (!panel) {
      throw new Error(
        "Unknown Corporate section: " + sectionId
      );
    }

    if (!(element instanceof HTMLElement)) {
      throw new Error(
        "Corporate section requires an HTML element."
      );
    }

    // Keep section heading and description.
    // Replace only previously mounted content.
    let slot = panel.querySelector(
      ".lb-section-slot"
    );

    if (!slot) {
      slot = el(
        "div",
        null,
        "lb-section-slot"
      );

      panel.appendChild(slot);
    }

    slot.replaceChildren(element);

    button.disabled = false;

    refresh();
  }

  // -----------------------------------------
  // ENABLE OR DISABLE SECTION
  // -----------------------------------------

  function setSectionEnabled(
    sectionId,
    enabled
  ) {
    const button = buttons.get(sectionId);

    if (!button) {
      throw new Error(
        "Unknown Corporate section: " + sectionId
      );
    }

    button.disabled = !enabled;

    if (
      !enabled &&
      activeSection === sectionId
    ) {
      const fallback = SECTIONS.find(
        (section) =>
          !buttons.get(section.id).disabled
      );

      activeSection = fallback
        ? fallback.id
        : "workflow";
    }

    refresh();
  }

  // -----------------------------------------
  // PUBLIC API
  // -----------------------------------------

  refresh();

  return {
    element: root,

    mountSection,

    showSection,

    setSectionEnabled,

    getActiveSection() {
      return activeSection;
    },

    getPanel(sectionId) {
      return panels.get(sectionId) || null;
    },

    reset() {
      const firstAvailable = SECTIONS.find(
        (section) =>
          !buttons.get(section.id).disabled
      );

      activeSection = firstAvailable
        ? firstAvailable.id
        : "workflow";

      refresh();
    }
  };
}
