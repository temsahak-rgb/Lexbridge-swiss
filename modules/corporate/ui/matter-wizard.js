
/**
 * LexBridge — Corporate Matter Wizard
 * Version: 0.1.0
 *
 * Splits the existing Corporate form into
 * four smaller steps.
 *
 * Reuses the original form fields and submit
 * event. No changes to legal workflow logic.
 */

"use strict";

import {
  createStepNavigator
} from "../../../js/core/step-navigator.js";

const GROUPS = [
  {
    id: "company",
    title: "Company Information",
    fields: [
      "companyName",
      "companyType",
      "canton"
    ]
  },
  {
    id: "change",
    title: "Proposed Change",
    fields: ["operation"]
  },
  {
    id: "person",
    title: "Person Details",
    fields: ["personName"]
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

function findFieldGroup(form, name) {
  const field = Array.from(
    form.elements
  ).find((control) => control.name === name);

  if (!field) {
    throw new Error(
      "Corporate form field missing: " + name
    );
  }

  const group = field.closest(".form-group");

  if (!group || !form.contains(group)) {
    throw new Error(
      "Cannot locate form group for: " + name
    );
  }

  return { field, group };
}

function validateFields(fields) {
  for (const field of fields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      field.focus();
      return false;
    }
  }

  return true;
}

function createConfirmation(form) {
  const section = el("div");

  section.append(
    el(
      "p",
      "Please confirm the information before " +
      "generating the preliminary legal workflow.",
      "card-description"
    )
  );

  const summary = el("dl");
  summary.style.display = "grid";
  summary.style.gridTemplateColumns =
    "minmax(120px, 1fr) 2fr";
  summary.style.gap = "12px";
  summary.style.marginTop = "18px";

  const labels = [
    ["companyName", "Company"],
    ["companyType", "Legal form"],
    ["canton", "Canton"],
    ["operation", "Proposed change"],
    ["personName", "Person concerned"]
  ];

  function refresh() {
    const data = new FormData(form);

    summary.replaceChildren();

    for (const [name, label] of labels) {
      const term = el("dt", label);
      term.style.fontWeight = "650";

      const value = String(
        data.get(name) || ""
      ).trim();

      const description = el(
        "dd",
        value || "Not provided"
      );

      description.style.margin = "0";
      description.style.overflowWrap = "anywhere";

      summary.append(term, description);
    }
  }

  section.appendChild(summary);

  return { element: section, refresh };
}

/**
 * Convert the existing Corporate form to a wizard.
 *
 * @param {HTMLFormElement} form
 * @param {HTMLButtonElement} submitButton
 *
 * @returns {Object} Wizard controller
 */
export function createMatterWizard(
  form,
  submitButton
) {
  if (!(form instanceof HTMLFormElement)) {
    throw new Error(
      "Matter Wizard requires a valid form."
    );
  }

  if (
    !(submitButton instanceof HTMLButtonElement) ||
    !form.contains(submitButton)
  ) {
    throw new Error(
      "Matter Wizard requires the original submit button."
    );
  }

  // Locate all original fields BEFORE moving any.
  const collectedGroups = GROUPS.map((group) => ({
    ...group,
    items: group.fields.map((name) =>
      findFieldGroup(form, name)
    )
  }));

  const allFields = collectedGroups.flatMap(
    (group) => group.items.map(
      (item) => item.field
    )
  );

  // The wizard handles validation itself.
  // This avoids browser errors when an invalid
  // required input is inside a hidden step.
  form.noValidate = true;

  const steps = collectedGroups.map((group) => {
    const content = el("div");

    for (const item of group.items) {
      content.appendChild(item.group);
    }

    return {
      id: group.id,
      title: group.title,
      content,
      validate: () => validateFields(
        group.items.map((item) => item.field)
      )
    };
  });

  const confirmation = createConfirmation(form);

  steps.push({
    id: "confirm",
    title: "Confirm Information",
    content: confirmation.element,
    validate: () => validateFields(allFields)
  });

  // Preserve the application's existing
  // submission event handler.
  let authorizedSubmit = false;

  const navigator = createStepNavigator({
    steps,

    onChange({ step }) {
      if (step.id === "confirm") {
        confirmation.refresh();
      }
    },

    onComplete() {
      confirmation.refresh();

      authorizedSubmit = true;

      try {
        form.requestSubmit(submitButton);
      } finally {
        authorizedSubmit = false;
      }
    }
  });

  // The original submit button remains in the
  // form and is used programmatically.
  submitButton.hidden = true;

  // Prevent accidental form submission from
  // bypassing the wizard's confirmation step.
  form.addEventListener(
    "submit",
    (event) => {
      if (!authorizedSubmit) {
        event.preventDefault();
        event.stopImmediatePropagation();

        // Allow Enter to advance through steps.
        navigator.next();
      }
    },
    true
  );

  // Keep the navigator INSIDE the form so
  // FormData(form) still includes all controls.
  form.prepend(navigator.element);

  return {
    element: navigator.element,

    goToStep: navigator.goToStep,
    next: navigator.next,
    back: navigator.back,
    reset: navigator.reset,

    getCurrentStep:
      navigator.getCurrentStep
  };
}
