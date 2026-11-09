
/**
 * LexBridge — Corporate Form
 * Version 0.3.0
 *
 * Creates and reads the Corporate Governance form.
 * Independent of the legal workflow engine.
 */

"use strict";

const COMPANY_TYPES = [
  { id: "SA", label: "SA / AG — Corporation" },
  { id: "SARL", label: "Sàrl / GmbH — Limited Liability Company" }
];

const CANTONS = [
  { id: "VD", label: "Vaud" },
  { id: "GE", label: "Geneva" },
  { id: "ZH", label: "Zurich" },
  { id: "BS", label: "Basel-Stadt" }
];

const OPERATIONS = [
  { id: "appoint", label: "Appointment of director / manager" },
  { id: "remove", label: "Removal or resignation" },
  { id: "signature", label: "Change of signing authority" }
];

function createElement(tag, text, className) {
  const node = document.createElement(tag);

  if (text !== undefined && text !== null) {
    node.textContent = String(text);
  }

  if (className) {
    node.className = className;
  }

  return node;
}

function addField(form, label, name, options = {}) {
  const wrapper = createElement("div", null, "form-group");

  const labelNode = createElement(
    "label",
    label,
    "form-label"
  );

  labelNode.htmlFor = "corporate-" + name;

  let control;

  if (Array.isArray(options.choices)) {
    control = createElement(
      "select",
      null,
      "form-control"
    );

    for (const choice of options.choices) {
      const option = createElement(
        "option",
        choice.label
      );

      option.value = choice.id;
      control.appendChild(option);
    }
  } else {
    control = createElement(
      "input",
      null,
      "form-control"
    );

    control.type = "text";
    control.maxLength = options.maxLength || 120;
    control.placeholder = options.placeholder || "";
  }

  control.id = "corporate-" + name;
  control.name = name;
  control.required = options.required !== false;

  wrapper.append(labelNode, control);
  form.appendChild(wrapper);

  return control;
}

export function createCorporateForm() {
  const form = createElement("form");
  form.id = "corporate-matter-form";
  form.style.marginTop = "22px";

  addField(form, "Company name", "companyName", {
    placeholder: "Example: Alpine Services SA"
  });

  addField(form, "Person concerned", "personName", {
    placeholder: "Example: Marie Dupont"
  });

  addField(form, "Company type", "companyType", {
    choices: COMPANY_TYPES
  });

  addField(form, "Registered canton", "canton", {
    choices: CANTONS
  });

  addField(form, "Type of change", "operation", {
    choices: OPERATIONS
  });

  const submitButton = createElement(
    "button",
    "Generate legal workflow",
    "btn btn-primary"
  );

  submitButton.type = "submit";
  form.appendChild(submitButton);

  const privacyNotice = createElement(
    "p",
    "Demo mode: use fictional names and company data. " +
    "No information is intentionally transmitted to " +
    "a LexBridge server.",
    "card-description"
  );

  privacyNotice.style.marginTop = "12px";

  form.appendChild(privacyNotice);

  return {
    form,
    submitButton
  };
}

/**
 * Read and normalise entered matter data.
 */
export function readCorporateMatter(form) {
  if (!(form instanceof HTMLFormElement)) {
    throw new Error("Invalid corporate form element.");
  }

  const data = new FormData(form);

  const fields = [
    "companyName",
    "personName",
    "companyType",
    "canton",
    "operation"
  ];

  const matter = {};

  for (const field of fields) {
    matter[field] = String(data.get(field) || "").trim();
  }

  if (!matter.companyName || !matter.personName) {
    throw new Error(
      "Company name and person name are required."
    );
  }

  if (!COMPANY_TYPES.some(x => x.id === matter.companyType)) {
    throw new Error("Unsupported company type.");
  }

  if (!CANTONS.some(x => x.id === matter.canton)) {
    throw new Error("Unsupported canton.");
  }

  if (!OPERATIONS.some(x => x.id === matter.operation)) {
    throw new Error("Unsupported operation.");
  }

  return matter;
}
