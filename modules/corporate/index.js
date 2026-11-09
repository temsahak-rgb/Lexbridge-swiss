
/**
 * LexBridge — Swiss Corporate Governance Module
 * Version 0.1.0
 *
 * Responsible only for the Corporate module UI.
 * Legal data and workflow logic will remain separate.
 */

"use strict";

const CANTONS = [
  { id: "VD", name: "Vaud" },
  { id: "GE", name: "Geneva" },
  { id: "ZH", name: "Zurich" },
  { id: "BS", name: "Basel-Stadt" }
];

const COMPANY_TYPES = [
  { id: "SA", name: "SA / AG — Corporation" },
  { id: "SARL", name: "Sàrl / GmbH — Limited Liability Company" }
];

const OPERATIONS = [
  { id: "appoint", name: "Appointment of a director / manager" },
  { id: "remove", name: "Removal or resignation" },
  { id: "signature", name: "Change of signing authority" }
];

function element(tag, options = {}) {
  const node = document.createElement(tag);

  if (options.className) {
    node.className = options.className;
  }

  if (options.text !== undefined) {
    node.textContent = String(options.text);
  }

  return node;
}

function createField(label, name, type = "text") {
  const wrapper = element("div", {
    className: "form-group"
  });

  const labelNode = element("label", {
    className: "form-label",
    text: label
  });

  labelNode.htmlFor = name;

  const input = element("input", {
    className: "form-control"
  });

  input.id = name;
  input.name = name;
  input.type = type;
  input.required = true;

  wrapper.append(labelNode, input);

  return { wrapper, input };
}

function createSelect(label, name, options) {
  const wrapper = element("div", {
    className: "form-group"
  });

  const labelNode = element("label", {
    className: "form-label",
    text: label
  });

  labelNode.htmlFor = name;

  const select = element("select", {
    className: "form-control"
  });

  select.id = name;
  select.name = name;
  select.required = true;

  for (const option of options) {
    const item = document.createElement("option");
    item.value = option.id;
    item.textContent = option.name;
    select.appendChild(item);
  }

  wrapper.append(labelNode, select);

  return { wrapper, select };
}

function readForm(form) {
  const data = new FormData(form);

  return {
    companyName: String(data.get("companyName") || "").trim(),
    personName: String(data.get("personName") || "").trim(),
    companyType: String(data.get("companyType") || ""),
    canton: String(data.get("canton") || ""),
    operation: String(data.get("operation") || "")
  };
}

function showDraftPreview(container, matter) {
  container.replaceChildren();

  const heading = element("h3", {
    text: "Matter summary"
  });

  const description = element("p", {
    text: "The Corporate module received the following details."
  });

  const fields = [
    ["Company", matter.companyName],
    ["Person", matter.personName],
    ["Company type", matter.companyType],
    ["Canton", matter.canton],
    ["Operation", matter.operation]
  ];

  const list = element("dl");

  for (const [label, value] of fields) {
    const term = element("dt", { text: label });
    term.style.fontWeight = "700";
    term.style.marginTop = "10px";

    const definition = element("dd", { text: value });
    definition.style.marginLeft = "0";

    list.append(term, definition);
  }

  const notice = element("p", {
    className: "card-description",
    text:
      "Preview only. The legal workflow engine " +
      "and official source validation are not yet connected."
  });

  container.append(heading, description, list, notice);
}

/**
 * Called by the central Module Loader.
 *
 * @param {object} context Shared application services.
 * @param {HTMLElement} container Module mounting point.
 */
export async function mount(context, container) {
  if (!container) {
    throw new Error("Corporate module container is missing.");
  }

  const section = element("section", {
    className: "card"
  });

  section.style.marginTop = "24px";

  const heading = element("h2", {
    text: "Corporate Governance"
  });

  const subtitle = element("p", {
    className: "card-description",
    text:
      "Prepare a Swiss company-management change. " +
      "Select the company type, canton and operation."
  });

  const form = element("form");
  form.id = "corporate-matter-form";

  const companyName = createField(
    "Company name",
    "companyName"
  );

  companyName.input.placeholder = "Example: Alpine Services SA";
  companyName.input.maxLength = 120;

  const personName = createField(
    "Person concerned",
    "personName"
  );

  personName.input.placeholder = "Full name";
  personName.input.maxLength = 120;

  const companyType = createSelect(
    "Company type",
    "companyType",
    COMPANY_TYPES
  );

  const canton = createSelect(
    "Registered canton",
    "canton",
    CANTONS
  );

  const operation = createSelect(
    "Type of change",
    "operation",
    OPERATIONS
  );

  const button = element("button", {
    className: "btn btn-primary",
    text: "Generate preliminary review"
  });

  button.type = "submit";

  form.append(
    companyName.wrapper,
    personName.wrapper,
    companyType.wrapper,
    canton.wrapper,
    operation.wrapper,
    button
  );

  const output = element("section", {
    className: "card"
  });

  output.style.marginTop = "20px";
  output.hidden = true;
  output.setAttribute("aria-live", "polite");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      const matter = readForm(form);

      if (!matter.companyName || !matter.personName) {
        throw new Error("Required information is missing.");
      }

      showDraftPreview(output, matter);
      output.hidden = false;

      context.setStatus(
        "Corporate matter preview generated.",
        "success"
      );

    } catch (error) {
      context.reportError(
        error,
        "Corporate matter form"
      );
    }
  });

  section.append(heading, subtitle, form);
  container.replaceChildren(section, output);
}
