
/**
 * LexBridge — Corporate Form
 * Version: 0.4.0
 *
 * Multilingual Corporate Governance form.
 *
 * Interface languages:
 * - English
 * - French
 * - German
 *
 * Features:
 * - Live translation without page reload
 * - Preserves entered form values
 * - Preserves select option values
 * - Compatible with Matter Wizard
 * - Independent of the legal workflow engine
 * - Accessible form labels
 *
 * No external dependencies.
 */

"use strict";

import {
  t,
  onLanguageChange
} from "../../../js/core/i18n.js";

// ---------------------------------------------
// FIXED LEGAL VALUES
// ---------------------------------------------

/**
 * These IDs must never be translated.
 *
 * The legal workflow engine relies on
 * these exact values.
 */

const COMPANY_TYPES = [
  {
    id: "SA",
    translationKey: "companyTypes.SA"
  },
  {
    id: "SARL",
    translationKey: "companyTypes.SARL"
  }
];

const CANTONS = [
  {
    id: "VD",
    translationKey: "cantons.VD"
  },
  {
    id: "GE",
    translationKey: "cantons.GE"
  },
  {
    id: "ZH",
    translationKey: "cantons.ZH"
  },
  {
    id: "BS",
    translationKey: "cantons.BS"
  }
];

const OPERATIONS = [
  {
    id: "appoint",
    translationKey: "operations.appoint"
  },
  {
    id: "remove",
    translationKey: "operations.remove"
  },
  {
    id: "signature",
    translationKey: "operations.signature"
  }
];

// ---------------------------------------------
// DOM HELPER
// ---------------------------------------------

function createElement(
  tag,
  text = null,
  className = ""
) {
  const node = document.createElement(tag);

  if (text !== undefined && text !== null) {
    node.textContent = String(text);
  }

  if (className) {
    node.className = className;
  }

  return node;
}

// ---------------------------------------------
// FIELD CREATION
// ---------------------------------------------

/**
 * Create a form field.
 *
 * Keeps a stable input/select element.
 * Language changes modify labels only.
 *
 * Returns:
 * - control
 * - updateTranslation()
 */

function addField(
  form,
  translationKey,
  name,
  options = {}
) {
  const wrapper = createElement(
    "div",
    null,
    "form-group"
  );

  const labelNode = createElement(
    "label",
    "",
    "form-label"
  );

  const fieldId = "corporate-" + name;

  labelNode.htmlFor = fieldId;

  let control;

  const choices = Array.isArray(
    options.choices
  )
    ? options.choices
    : null;

  const optionNodes = [];

  if (choices) {
    control = createElement(
      "select",
      null,
      "form-control"
    );

    for (const choice of choices) {
      const optionNode = createElement(
        "option",
        ""
      );

      // These values are legally meaningful
      // and must remain unchanged.
      optionNode.value = choice.id;

      control.appendChild(optionNode);

      optionNodes.push({
        element: optionNode,
        translationKey: choice.translationKey
      });
    }
  } else {
    control = createElement(
      "input",
      null,
      "form-control"
    );

    control.type = "text";

    control.maxLength =
      options.maxLength || 120;
  }

  control.id = fieldId;
  control.name = name;

  control.required =
    options.required !== false;

  wrapper.append(
    labelNode,
    control
  );

  form.appendChild(wrapper);

  // -------------------------------------------
  // TRANSLATION UPDATE
  // -------------------------------------------

  function updateTranslation() {
    const translatedLabel = t(
      translationKey
    );

    labelNode.textContent =
      translatedLabel;

    if (
      !choices &&
      options.placeholderKey
    ) {
      control.placeholder = t(
        options.placeholderKey
      );
    }

    if (choices) {
      for (const item of optionNodes) {
        item.element.textContent = t(
          item.translationKey
        );
      }
    }
  }

  updateTranslation();

  return {
    control,
    updateTranslation
  };
}

// ---------------------------------------------
// CORPORATE FORM
// ---------------------------------------------

/**
 * Create the Corporate Governance form.
 *
 * Existing return properties are preserved:
 *
 * {
 *   form,
 *   submitButton
 * }
 *
 * Additional optional method:
 *
 * destroy()
 *
 * Call destroy() when permanently removing
 * the form, to unsubscribe from language events.
 */

export function createCorporateForm() {
  const form = createElement("form");

  form.id = "corporate-matter-form";

  form.style.marginTop = "22px";

  // -------------------------------------------
  // FIELD REGISTRY
  // -------------------------------------------

  const fields = [];

  function registerField(
    translationKey,
    name,
    options
  ) {
    const field = addField(
      form,
      translationKey,
      name,
      options
    );

    fields.push(field);

    return field.control;
  }

  // -------------------------------------------
  // COMPANY NAME
  // -------------------------------------------

  registerField(
    "corporate.companyName",
    "companyName",
    {
      placeholderKey:
        "corporate.companyNamePlaceholder"
    }
  );

  // -------------------------------------------
  // PERSON CONCERNED
  // -------------------------------------------

  registerField(
    "corporate.personName",
    "personName",
    {
      placeholderKey:
        "corporate.personNamePlaceholder"
    }
  );

  // -------------------------------------------
  // COMPANY TYPE
  // -------------------------------------------

  registerField(
    "corporate.companyType",
    "companyType",
    {
      choices: COMPANY_TYPES
    }
  );

  // -------------------------------------------
  // REGISTERED CANTON
  // -------------------------------------------

  registerField(
    "corporate.registeredCanton",
    "canton",
    {
      choices: CANTONS
    }
  );

  // -------------------------------------------
  // OPERATION TYPE
  // -------------------------------------------

  registerField(
    "corporate.operation",
    "operation",
    {
      choices: OPERATIONS
    }
  );

  // -------------------------------------------
  // SUBMIT BUTTON
  // -------------------------------------------

  const submitButton = createElement(
    "button",
    "",
    "btn btn-primary"
  );

  submitButton.type = "submit";

  form.appendChild(submitButton);

  // -------------------------------------------
  // PRIVACY NOTICE
  // -------------------------------------------

  const privacyNotice = createElement(
    "p",
    "",
    "card-description"
  );

  privacyNotice.style.marginTop =
    "12px";

  form.appendChild(privacyNotice);

  // -------------------------------------------
  // LIVE TRANSLATION
  // -------------------------------------------

  function updateTranslations() {
    for (const field of fields) {
      field.updateTranslation();
    }

    submitButton.textContent = t(
      "corporate.generateWorkflow"
    );

    // These keys already exist in
    // en.json, fr.json and de.json.
    privacyNotice.textContent =
      t("privacy.confidentiality") +
      " " +
      t("privacy.noServerStorage");
  }

  // Subscribe once for this form instance.
  const unsubscribe = onLanguageChange(
    updateTranslations
  );

  // Translate immediately using the
  // current interface language.
  updateTranslations();

  // -------------------------------------------
  // PUBLIC API
  // -------------------------------------------

  return {
    form,
    submitButton,

    updateTranslations,

    destroy() {
      unsubscribe();
    }
  };
}

// ---------------------------------------------
// READ CORPORATE MATTER
// ---------------------------------------------

/**
 * Read and normalise entered matter data.
 *
 * Important:
 * - Values do not depend on UI language.
 * - All original field names are preserved.
 * - The workflow receives the same data shape.
 */

export function readCorporateMatter(form) {
  if (!(form instanceof HTMLFormElement)) {
    throw new Error(
      t("validation.invalidForm")
    );
  }

  const data = new FormData(form);

  const fieldNames = [
    "companyName",
    "personName",
    "companyType",
    "canton",
    "operation"
  ];

  const matter = {};

  for (const field of fieldNames) {
    matter[field] = String(
      data.get(field) || ""
    ).trim();
  }

  // -------------------------------------------
  // REQUIRED TEXT FIELDS
  // -------------------------------------------

  if (
    !matter.companyName ||
    !matter.personName
  ) {
    throw new Error(
      t("validation.completeStep")
    );
  }

  // -------------------------------------------
  // COMPANY TYPE VALIDATION
  // -------------------------------------------

  const validCompanyType =
    COMPANY_TYPES.some(
      (item) =>
        item.id === matter.companyType
    );

  if (!validCompanyType) {
    throw new Error(
      t("validation.invalidForm")
    );
  }

  // -------------------------------------------
  // CANTON VALIDATION
  // -------------------------------------------

  const validCanton =
    CANTONS.some(
      (item) =>
        item.id === matter.canton
    );

  if (!validCanton) {
    throw new Error(
      t("validation.invalidForm")
    );
  }

  // -------------------------------------------
  // OPERATION VALIDATION
  // -------------------------------------------

  const validOperation =
    OPERATIONS.some(
      (item) =>
        item.id === matter.operation
    );

  if (!validOperation) {
    throw new Error(
      t("validation.invalidForm")
    );
  }

  return matter;
}
