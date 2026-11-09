
/**
 * LexBridge — Corporate Matter Wizard
 * Version: 0.2.0
 *
 * Four-step multilingual matter wizard.
 *
 * Languages:
 * - English
 * - French
 * - German
 *
 * Features:
 * - Reuses existing form controls
 * - Preserves entered values
 * - Localizes confirmation summary
 * - Localizes displayed legal values
 * - Localizes step headings and controls
 * - Preserves original submit behavior
 * - Does not regenerate legal workflows
 *
 * Framework-free ES module.
 */

"use strict";

import {
  createStepNavigator
} from "../../../js/core/step-navigator.js";

import {
  t,
  getLanguage,
  onLanguageChange
} from "../../../js/core/i18n.js";

// ---------------------------------------------
// STEP DEFINITIONS
// ---------------------------------------------

const GROUPS = [
  {
    id: "company",
    titleKey: "corporate.companyInformation",
    fields: [
      "companyName",
      "companyType",
      "canton"
    ]
  },
  {
    id: "change",
    titleKey: "corporate.proposedChange",
    fields: ["operation"]
  },
  {
    id: "person",
    titleKey: "corporate.personDetails",
    fields: ["personName"]
  }
];

const CONFIRM_TITLE_KEY =
  "corporate.confirmInformation";

// ---------------------------------------------
// CONFIRMATION FIELD DEFINITIONS
// ---------------------------------------------

const SUMMARY_FIELDS = [
  {
    name: "companyName",
    labelKey: "corporate.company"
  },
  {
    name: "companyType",
    labelKey: "corporate.legalForm"
  },
  {
    name: "canton",
    labelKey: "corporate.canton"
  },
  {
    name: "operation",
    labelKey: "corporate.proposedChange"
  },
  {
    name: "personName",
    labelKey: "corporate.personName"
  }
];

// ---------------------------------------------
// DOM HELPER
// ---------------------------------------------

function el(tag, text = null, className = "") {
  const node = document.createElement(tag);

  if (text !== null && text !== undefined) {
    node.textContent = String(text);
  }

  if (className) {
    node.className = className;
  }

  return node;
}

// ---------------------------------------------
// FORM HELPERS
// ---------------------------------------------

function findFieldGroup(form, name) {
  const field = Array.from(
    form.elements
  ).find(
    (control) => control.name === name
  );

  if (!field) {
    throw new Error(
      "Corporate form field missing: " + name
    );
  }

  const group = field.closest(
    ".form-group"
  );

  if (
    !group ||
    !form.contains(group)
  ) {
    throw new Error(
      "Cannot locate form group for: " + name
    );
  }

  return {
    field,
    group
  };
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

// ---------------------------------------------
// DISPLAY VALUES
// ---------------------------------------------

/**
 * Translate the displayed value while
 * keeping the underlying code unchanged.
 *
 * Example:
 * appoint -> Nomination
 * BS      -> Bâle-Ville
 * SA      -> Société anonyme...
 */

function formatMatterValue(name, value) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return t("corporate.notProvided");
  }

  if (name === "companyType") {
    return t("companyTypes." + raw);
  }

  if (name === "canton") {
    return t("cantons." + raw);
  }

  if (name === "operation") {
    return t("operations." + raw);
  }

  // Company names and person names
  // must never be translated.
  return raw;
}

// ---------------------------------------------
// CONFIRMATION SUMMARY
// ---------------------------------------------

function createConfirmation(form) {
  const section = el(
    "div",
    null,
    "lb-matter-confirmation"
  );

  const introduction = el(
    "p",
    "",
    "card-description"
  );

  const summary = el("dl");

  summary.style.display = "grid";

  summary.style.gridTemplateColumns =
    "minmax(95px, 1fr) minmax(0, 2fr)";

  summary.style.gap = "12px";

  summary.style.marginTop = "18px";

  const rows = new Map();

  // Create summary rows once.
  // Language changes only update text.
  for (const field of SUMMARY_FIELDS) {
    const term = el("dt");
    const description = el("dd");

    term.style.fontWeight = "650";
    term.style.overflowWrap = "anywhere";

    description.style.margin = "0";
    description.style.overflowWrap = "anywhere";

    summary.append(
      term,
      description
    );

    rows.set(field.name, {
      term,
      description
    });
  }

  section.append(
    introduction,
    summary
  );

  function refresh() {
    const data = new FormData(form);

    introduction.textContent =
      t("corporate.confirmDescription");

    for (const field of SUMMARY_FIELDS) {
      const row = rows.get(
        field.name
      );

      row.term.textContent =
        t(field.labelKey);

      const value = data.get(
        field.name
      );

      row.description.textContent =
        formatMatterValue(
          field.name,
          value
        );
    }
  }

  refresh();

  return {
    element: section,
    refresh
  };
}

// ---------------------------------------------
// NAVIGATOR TRANSLATION
// ---------------------------------------------

/**
 * step-navigator.js owns the actual
 * step navigation UI.
 *
 * This adapter updates known navigation
 * labels without replacing its elements.
 *
 * It also handles navigator updates
 * that occur after changing steps.
 */

const NAVIGATION_LABELS = [
  {
    english: "Back",
    key: "actions.back"
  },
  {
    english: "Previous",
    key: "actions.previous"
  },
  {
    english: "Next",
    key: "actions.next"
  },
  {
    english: "Continue",
    key: "actions.continue"
  },
  {
    english: "Finish",
    key: "actions.finish"
  }
];

function formatStepCounter(current, total) {
  const language = getLanguage();

  if (language === "fr") {
    return `ÉTAPE ${current} SUR ${total}`;
  }

  if (language === "de") {
    return `SCHRITT ${current} VON ${total}`;
  }

  return `STEP ${current} OF ${total}`;
}

function createNavigatorTranslator(
  navigator,
  steps
) {
  const root = navigator.element;

  // Keep a record of labels that have
  // already been rendered in previous
  // interface languages.
  const knownLabels = new Map();

  function remember(key, value) {
    if (!knownLabels.has(key)) {
      knownLabels.set(
        key,
        new Set()
      );
    }

    knownLabels.get(key).add(value);
  }

  for (const item of NAVIGATION_LABELS) {
    remember(
      item.key,
      item.english
    );
  }

  for (const step of steps) {
    remember(
      step.titleKey,
      step.initialTitle
    );
  }

  function translateText(text) {
    const trimmed = text.trim();

    if (!trimmed) {
      return null;
    }

    const counter = trimmed.match(
      /^(?:STEP|ÉTAPE|SCHRITT)\s+(\d+)\s+(?:OF|SUR|VON)\s+(\d+)$/i
    );

    if (counter) {
      return formatStepCounter(
        counter[1],
        counter[2]
      );
    }

    for (const [
      key,
      previousValues
    ] of knownLabels) {
      if (previousValues.has(trimmed)) {
        const translated = t(key);

        remember(
          key,
          translated
        );

        return translated;
      }
    }

    return null;
  }

  function refresh() {
    // If the navigator reads step.title
    // during rendering, it will now receive
    // the current translation.
    for (const step of steps) {
      step.reference.title =
        t(step.titleKey);

      remember(
        step.titleKey,
        step.reference.title
      );
    }

    // Translate only text nodes.
    // Never replace the navigator itself.
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

    const textNodes = [];

    while (walker.nextNode()) {
      textNodes.push(
        walker.currentNode
      );
    }

    for (const node of textNodes) {
      const original = node.textContent;
      const translated =
        translateText(original);

      if (
        translated !== null &&
        translated !== original.trim()
      ) {
        const leading =
          original.match(/^\s*/)?.[0] || "";

        const trailing =
          original.match(/\s*$/)?.[0] || "";

        node.textContent =
          leading +
          translated +
          trailing;
      }
    }
  }

  // The navigator may re-render labels
  // when the current step changes.
  // Observe those changes and translate
  // only newly inserted text.
  const observer = new MutationObserver(
    () => {
      refresh();
    }
  );

  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true
  });

  refresh();

  return {
    refresh,

    destroy() {
      observer.disconnect();
    }
  };
}

// ---------------------------------------------
// CREATE MATTER WIZARD
// ---------------------------------------------

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

  // -------------------------------------------
  // COLLECT EXISTING FIELDS
  // -------------------------------------------

  const collectedGroups = GROUPS.map(
    (group) => ({
      ...group,

      items: group.fields.map(
        (name) =>
          findFieldGroup(
            form,
            name
          )
      )
    })
  );

  const allFields =
    collectedGroups.flatMap(
      (group) =>
        group.items.map(
          (item) => item.field
        )
    );

  // The wizard validates each step.
  // Hidden fields should not trigger
  // native browser submit errors.
  form.noValidate = true;

  // -------------------------------------------
  // CREATE STEPS
  // -------------------------------------------

  const steps = collectedGroups.map(
    (group) => {
      const content = el("div");

      for (const item of group.items) {
        content.appendChild(
          item.group
        );
      }

      return {
        id: group.id,
        title: t(group.titleKey),
        content,

        validate: () =>
          validateFields(
            group.items.map(
              (item) => item.field
            )
          )
      };
    }
  );

  const confirmation =
    createConfirmation(form);

  steps.push({
    id: "confirm",
    title: t(CONFIRM_TITLE_KEY),
    content: confirmation.element,

    validate: () =>
      validateFields(allFields)
  });

  // -------------------------------------------
  // PRESERVE ORIGINAL SUBMIT LOGIC
  // -------------------------------------------

  let authorizedSubmit = false;

  const navigator =
    createStepNavigator({
      steps,

      onChange({ step }) {
        if (step.id === "confirm") {
          confirmation.refresh();
        }

        // Update translated labels after
        // the navigator changes steps.
        queueMicrotask(() => {
          navigatorTranslator.refresh();
        });
      },

      onComplete() {
        confirmation.refresh();

        authorizedSubmit = true;

        try {
          form.requestSubmit(
            submitButton
          );
        } finally {
          authorizedSubmit = false;
        }
      }
    });

  // -------------------------------------------
  // NAVIGATOR TRANSLATION REGISTRY
  // -------------------------------------------

  const stepTranslations = steps.map(
    (step, index) => {
      const titleKey =
        index < GROUPS.length
          ? GROUPS[index].titleKey
          : CONFIRM_TITLE_KEY;

      return {
        reference: step,
        titleKey,
        initialTitle: step.title
      };
    }
  );

  const navigatorTranslator =
    createNavigatorTranslator(
      navigator,
      stepTranslations
    );

  // -------------------------------------------
  // PROTECT WIZARD SUBMISSION
  // -------------------------------------------

  submitButton.hidden = true;

  form.addEventListener(
    "submit",
    (event) => {
      if (!authorizedSubmit) {
        event.preventDefault();

        event.stopImmediatePropagation();

        navigator.next();
      }
    },
    true
  );

  // Keep controls within the original
  // form so FormData(form) is unchanged.
  form.prepend(
    navigator.element
  );

  // -------------------------------------------
  // LIVE LANGUAGE CHANGE
  // -------------------------------------------

  function updateTranslations() {
    confirmation.refresh();

    navigatorTranslator.refresh();
  }

  const unsubscribe =
    onLanguageChange(
      updateTranslations
    );

  updateTranslations();

  // -------------------------------------------
  // PUBLIC API
  // -------------------------------------------

  return {
    element: navigator.element,

    goToStep: navigator.goToStep,
    next: navigator.next,
    back: navigator.back,
    reset: navigator.reset,

    getCurrentStep:
      navigator.getCurrentStep,

    updateTranslations,

    destroy() {
      unsubscribe();

      navigatorTranslator.destroy();
    }
  };
}
