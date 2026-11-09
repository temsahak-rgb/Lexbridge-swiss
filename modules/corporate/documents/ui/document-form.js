
/**
 * LexBridge — Corporate Document Form
 * Version: 0.1.0
 *
 * Independent UI component for document drafting.
 * Does not generate legal documents itself.
 */

"use strict";

import {
  listDocumentTemplates
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

function createField(form, {
  name,
  label,
  type = "text",
  required = true,
  placeholder = "",
  options = []
}) {
  const group = el("div", null, "form-group");

  const labelNode = el("label", label, "form-label");
  labelNode.htmlFor = "document-" + name;

  let control;

  if (type === "select") {
    control = el("select", null, "form-control");

    for (const option of options) {
      const entry = el("option", option.label);
      entry.value = option.id;
      control.appendChild(entry);
    }
  } else {
    control = el("input", null, "form-control");
    control.type = type;
    control.placeholder = placeholder;

    if (type === "text") {
      control.maxLength = 150;
    }
  }

  control.id = "document-" + name;
  control.name = name;
  control.required = required;

  group.append(labelNode, control);
  form.appendChild(group);

  return control;
}

/**
 * Create the document generator form.
 *
 * The matter fields are supplied separately by
 * the validated Corporate Governance workflow.
 */
export function createDocumentForm() {
  const form = el("form");
  form.id = "corporate-document-form";

  const templates = listDocumentTemplates();

  const template = createField(form, {
    name: "templateId",
    label: "Document template",
    type: "select",
    options: templates
  });

  createField(form, {
    name: "roleName",
    label: "Corporate role",
    placeholder:
      "e.g. Administratrice / Mitglied des Verwaltungsrats"
  });

  createField(form, {
    name: "appointmentDate",
    label: "Appointment decision date",
    type: "date"
  });

  createField(form, {
    name: "city",
    label: "Place of signature",
    placeholder: "e.g. Lausanne / Zürich"
  });

  const today = new Date();
  const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  const documentDate = createField(form, {
    name: "documentDate",
    label: "Document date",
    type: "date"
  });

  documentDate.value = localDate;

  const submit = el(
    "button",
    "Generate document draft",
    "btn btn-primary"
  );

  submit.type = "submit";
  form.appendChild(submit);

  const notice = el(
    "p",
    "Draft document only. The content must be " +
    "reviewed and signed in accordance with " +
    "the competent commercial registry's requirements.",
    "card-description"
  );

  notice.style.marginTop = "12px";
  form.appendChild(notice);

  return {
    form,
    submitButton: submit,
    templateSelect: template
  };
}

/**
 * Read the document drafting information.
 *
 * @param {HTMLFormElement} form
 * @returns {Object}
 */
export function readDocumentDetails(form) {
  if (!(form instanceof HTMLFormElement)) {
    throw new Error("Invalid document form.");
  }

  const data = new FormData(form);

  const templateId = String(
    data.get("templateId") || ""
  ).trim();

  const allowed = listDocumentTemplates().some(
    (entry) => entry.id === templateId
  );

  if (!allowed) {
    throw new Error("Unsupported document template.");
  }

  const details = {};

  for (const field of [
    "roleName",
    "appointmentDate",
    "city",
    "documentDate"
  ]) {
    details[field] = String(
      data.get(field) || ""
    ).trim();
  }

  return {
    templateId,
    details
  };
}
