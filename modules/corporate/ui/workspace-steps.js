
/**
 * LexBridge — Corporate Workspace Steps
 * Version: 0.1.0
 *
 * Accessible, step-based Corporate interface.
 * Keeps existing forms and reports mounted.
 *
 * No legal logic or external dependencies.
 */

"use strict";

const STEPS = [
  {
    id: "matter",
    number: 1,
    title: "Matter Details",
    description: "Company and proposed change"
  },
  {
    id: "review",
    number: 2,
    title: "Legal Review",
    description: "Checklist and legal sources"
  },
  {
    id: "documents",
    number: 3,
    title: "Documents",
    description: "Prepare document drafts"
  }
];

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
 * Create the Corporate step-based workspace.
 *
 * The existing UI elements are moved, not copied.
 * This preserves their form values and event listeners.
 *
 * @param {Object} options
 * @param {HTMLElement} options.formPanel
 * @param {HTMLElement} options.reportContainer
 * @param {HTMLElement} options.documentContainer
 */
export function createCorporateStepWorkspace({
  formPanel,
  reportContainer,
  documentContainer
}) {
  const elements = [
    formPanel,
    reportContainer,
    documentContainer
  ];

  if (!elements.every(
    (node) => node instanceof HTMLElement
  )) {
    throw new Error(
      "Corporate workspace requires three valid panels."
    );
  }

  const root = el(
    "section",
    null,
    "lb-corporate-steps"
  );

  const navigation = el(
    "nav",
    null,
    "lb-steps"
  );

  navigation.setAttribute(
    "aria-label",
    "Corporate workflow steps"
  );

  const panels = {
    matter: formPanel,
    review: reportContainer,
    documents: documentContainer
  };

  const buttons = new Map();

  let currentStep = "matter";
  let workflowReady = false;
  let documentsAvailable = false;

  // Assign accessible navigation labels.
  for (const step of STEPS) {
    const button = el(
      "button",
      null,
      "lb-step"
    );

    button.type = "button";
    button.dataset.step = step.id;

    const number = el(
      "span",
      String(step.number),
      "lb-step-number"
    );

    number.setAttribute(
      "aria-hidden",
      "true"
    );

    const label = el(
      "span",
      step.title
    );

    button.append(number, label);

    button.addEventListener("click", () => {
      showStep(step.id);
    });

    buttons.set(step.id, button);
    navigation.appendChild(button);
  }

  const content = el(
    "div",
    null,
    "lb-step-content"
  );

  // Move original elements into their own panels.
  // Existing event listeners remain attached.
  content.append(
    formPanel,
    reportContainer,
    documentContainer
  );

  root.append(navigation, content);

  function isAvailable(stepId) {
    if (stepId === "matter") return true;

    if (stepId === "review") {
      return workflowReady;
    }

    if (stepId === "documents") {
      return workflowReady && documentsAvailable;
    }

    return false;
  }

  function refresh() {
    for (const step of STEPS) {
      const button = buttons.get(step.id);

      const active = step.id === currentStep;
      const available = isAvailable(step.id);

      button.disabled = !available;

      button.classList.toggle(
        "is-current",
        active
      );

      button.classList.toggle(
        "is-complete",
        !active &&
        available &&
        step.number <
          STEPS.find(
            (entry) => entry.id === currentStep
          ).number
      );

      if (active) {
        button.setAttribute(
          "aria-current",
          "step"
        );
      } else {
        button.removeAttribute("aria-current");
      }

      panels[step.id].hidden = !active;
    }
  }

  function showStep(stepId) {
    if (!isAvailable(stepId)) {
      return false;
    }

    currentStep = stepId;
    refresh();

    return true;
  }

  /**
   * Called after successful workflow generation.
   */
  function setWorkflowReady({
    allowDocuments = false
  } = {}) {
    workflowReady = true;
    documentsAvailable = Boolean(allowDocuments);

    showStep("review");
  }

  /**
   * Return to the form when the existing matter
   * must be generated again.
   */
  function reset() {
    workflowReady = false;
    documentsAvailable = false;
    currentStep = "matter";
    refresh();
  }

  refresh();

  return {
    element: root,
    showStep,
    setWorkflowReady,
    reset,

    getCurrentStep() {
      return currentStep;
    }
  };
}
