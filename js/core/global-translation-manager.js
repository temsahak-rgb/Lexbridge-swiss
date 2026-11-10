
/**
 * LexBridge — Global Translation Manager
 * Version: 0.1.0
 *
 * Centralized translation of interface text.
 *
 * - English / French / German
 * - Uses existing locales/*.json
 * - Detects dynamically inserted UI elements
 * - Reacts to language changes
 * - Preserves form values and workflow state
 * - Avoids translating user-entered data
 * - Requires no external translation API
 *
 * This is a dictionary-based UI translator,
 * not a legal-document translation service.
 */

"use strict";

import {
  t,
  getLanguage,
  loadLanguage,
  onLanguageChange
} from "./i18n.js";

const LANGUAGES = ["en", "fr", "de"];

const SKIP_ELEMENTS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "CODE",
  "PRE",
  "SVG",
  "DD"
]);

const TEXT_ELEMENTS = new Set([
  "BUTTON",
  "LABEL",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "SPAN",
  "DT",
  "OPTION",
  "A",
  "SMALL",
  "STRONG",
  "B",
  "LI",
  "DIV"
]);

/*
 * Legacy UI strings.
 *
 * These are existing visible strings that
 * do not exactly match the English dictionary.
 *
 * They are mapped to established translation
 * keys rather than translated separately.
 */

const LEGACY_ALIASES = {
  "New Corporate Matter":
    "corporate.newMatter",

  "Edit Corporate Matter":
    "corporate.editMatter",

  "Enter or edit the case information. Existing review progress will be retained where compatible.":
    "corporate.matterEditDescription",

  "Cancel Editing":
    "corporate.cancelEditing",

  "Corporate Matter":
    "corporate.matterTitle",

  "Edit Matter Details":
    "corporate.editMatterDetails",

  "Review your workflow, legal considerations, official sources and documents.":
    "corporate.reviewDescription",

  "Company Information":
    "corporate.companyInformation",

  "Proposed Change":
    "corporate.proposedChange",

  "Person Details":
    "corporate.personDetails",

  "Confirm Information":
    "corporate.confirmInformation",

  "Please confirm the information before generating the preliminary legal workflow.":
    "corporate.confirmDescription",

  "Company":
    "corporate.company",

  "Legal form":
    "corporate.legalForm",

  "Canton":
    "corporate.canton",

  "Person concerned":
    "corporate.personName",

  "Not provided":
    "corporate.notProvided",

  "Previous":
    "actions.previous",

  "Next":
    "actions.next",

  "Back":
    "actions.back",

  "Continue":
    "actions.continue",

  "Finish":
    "actions.finish",

  "Workflow":
    "sections.workflow",

  "Legal Considerations":
    "sections.warnings",

  "Official Legal Sources":
    "sections.sources",

  "Document Generator":
    "sections.documents"
};

// ---------------------------------------------
// HELPERS
// ---------------------------------------------

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function flattenDictionary(
  value,
  prefix = "",
  output = {}
) {
  if (!isPlainObject(value)) {
    return output;
  }

  for (const [name, entry] of Object.entries(value)) {
    const key = prefix
      ? prefix + "." + name
      : name;

    if (typeof entry === "string") {
      output[key] = entry;
    } else if (isPlainObject(entry)) {
      flattenDictionary(
        entry,
        key,
        output
      );
    }
  }

  return output;
}

function formatCounter(
  current,
  total,
  language
) {
  if (language === "fr") {
    return `ÉTAPE ${current} SUR ${total}`;
  }

  if (language === "de") {
    return `SCHRITT ${current} VON ${total}`;
  }

  return `STEP ${current} OF ${total}`;
}

function translateCounter(value) {
  const match = normalizeText(value).match(
    /^(?:STEP|ÉTAPE|SCHRITT)\s+(\d+)\s+(?:OF|SUR|VON)\s+(\d+)$/i
  );

  if (!match) {
    return null;
  }

  return formatCounter(
    match[1],
    match[2],
    getLanguage()
  );
}

function isExcluded(element) {
  let current = element;

  while (current) {
    if (
      SKIP_ELEMENTS.has(current.tagName) ||
      current.isContentEditable ||
      current.hasAttribute?.(
        "data-i18n-ignore"
      )
    ) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

// ---------------------------------------------
// TRANSLATION MANAGER
// ---------------------------------------------

/**
 * Create a central UI translation manager.
 *
 * @param {Object} options
 * @param {HTMLElement} options.root
 *
 * Public API:
 * - start()
 * - refresh()
 * - getMissingTranslations()
 * - destroy()
 */

export function createGlobalTranslationManager({
  root = document.body
} = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error(
      "Global Translation Manager requires an HTML root."
    );
  }

  let started = false;
  let destroyed = false;

  let observer = null;
  let unsubscribe = null;

  const translationIndex = new Map();
  const originalNodes = new WeakMap();
  const missingTranslations = new Set();

  let scanning = false;

  // -------------------------------------------
  // BUILD TRANSLATION INDEX
  // -------------------------------------------

  async function buildIndex() {
    const dictionaries = await Promise.all(
      LANGUAGES.map(
        (language) => loadLanguage(language)
      )
    );

    const flattened = dictionaries.map(
      (dictionary) =>
        flattenDictionary(dictionary)
    );

    translationIndex.clear();

    for (const dictionary of flattened) {
      for (const [key, value] of Object.entries(
        dictionary
      )) {
        const normalized = normalizeText(
          value
        );

        if (
          !normalized ||
          normalized.includes("{{")
        ) {
          continue;
        }

        if (!translationIndex.has(normalized)) {
          translationIndex.set(
            normalized,
            key
          );
        }
      }
    }

    for (const [text, key] of Object.entries(
      LEGACY_ALIASES
    )) {
      translationIndex.set(
        normalizeText(text),
        key
      );
    }
  }

  // -------------------------------------------
  // TRANSLATE TEXT VALUE
  // -------------------------------------------

  function translateValue(value) {
    const normalized = normalizeText(value);

    if (!normalized) {
      return null;
    }

    const counter = translateCounter(
      normalized
    );

    if (counter !== null) {
      return counter;
    }

    const key = translationIndex.get(
      normalized
    );

    if (!key) {
      return null;
    }

    const translated = t(key);

    // Do not show internal translation keys
    // as user-facing text.
    if (translated === key) {
      missingTranslations.add(key);
      return null;
    }

    return translated;
  }

  // -------------------------------------------
  // TRANSLATE INDIVIDUAL TEXT NODE
  // -------------------------------------------

  function translateTextNode(node) {
    if (
      !node ||
      node.nodeType !== Node.TEXT_NODE
    ) {
      return;
    }

    const parent = node.parentElement;

    if (
      !parent ||
      !TEXT_ELEMENTS.has(parent.tagName) ||
      isExcluded(parent)
    ) {
      return;
    }

    const current = node.textContent || "";

    if (!normalizeText(current)) {
      return;
    }

    /*
     * Remember only text that belongs to a
     * recognized UI translation.
     *
     * Other text, including client names and
     * legal content, is left untouched.
     */

    const previous = originalNodes.get(node);

    let source = current;

    if (
      previous &&
      current === previous.lastRendered
    ) {
      source = previous.source;
    }

    const translated = translateValue(
      source
    );

    if (translated === null) {
      return;
    }

    const leading =
      current.match(/^\s*/)?.[0] || "";

    const trailing =
      current.match(/\s*$/)?.[0] || "";

    const nextText =
      leading + translated + trailing;

    originalNodes.set(node, {
      source: normalizeText(source),
      lastRendered: nextText
    });

    if (current !== nextText) {
      node.textContent = nextText;
    }
  }

  // -------------------------------------------
  // TRANSLATE EXPLICIT ATTRIBUTES
  // -------------------------------------------

  function translateExplicitElement(element) {
    if (
      !(element instanceof HTMLElement) ||
      isExcluded(element)
    ) {
      return;
    }

    const key = element.getAttribute(
      "data-i18n"
    );

    if (key) {
      const translated = t(key);

      if (translated !== key) {
        element.textContent = translated;
      } else {
        missingTranslations.add(key);
      }
    }

    const placeholderKey =
      element.getAttribute(
        "data-i18n-placeholder"
      );

    if (placeholderKey) {
      const translated = t(
        placeholderKey
      );

      if (translated !== placeholderKey) {
        element.setAttribute(
          "placeholder",
          translated
        );
      } else {
        missingTranslations.add(
          placeholderKey
        );
      }
    }

    const titleKey = element.getAttribute(
      "data-i18n-title"
    );

    if (titleKey) {
      const translated = t(titleKey);

      if (translated !== titleKey) {
        element.setAttribute(
          "title",
          translated
        );
      } else {
        missingTranslations.add(titleKey);
      }
    }
  }

  // -------------------------------------------
  // SCAN DOM
  // -------------------------------------------

  function refresh() {
    if (
      destroyed ||
      !started ||
      scanning
    ) {
      return;
    }

    scanning = true;

    try {
      const explicitElements = [];

      if (root.matches("[data-i18n]")) {
        explicitElements.push(root);
      }

      explicitElements.push(
        ...root.querySelectorAll(
          "[data-i18n], " +
          "[data-i18n-placeholder], " +
          "[data-i18n-title]"
        )
      );

      for (const element of explicitElements) {
        translateExplicitElement(
          element
        );
      }

      const walker =
        document.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT
        );

      const nodes = [];

      while (walker.nextNode()) {
        nodes.push(
          walker.currentNode
        );
      }

      for (const node of nodes) {
        translateTextNode(node);
      }
    } finally {
      scanning = false;
    }
  }

  // -------------------------------------------
  // OBSERVE DYNAMIC CONTENT
  // -------------------------------------------

  function beginObserving() {
    observer = new MutationObserver(
      () => {
        refresh();
      }
    );

    observer.observe(root, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  // -------------------------------------------
  // INITIALIZATION
  // -------------------------------------------

  async function start() {
    if (destroyed) {
      throw new Error(
        "Translation Manager has been destroyed."
      );
    }

    if (started) {
      return;
    }

    await buildIndex();

    if (destroyed || started) {
      return;
    }

    started = true;

    refresh();

    unsubscribe = onLanguageChange(
      refresh
    );

    beginObserving();
  }

  // -------------------------------------------
  // DIAGNOSTICS
  // -------------------------------------------

  function getMissingTranslations() {
    return Array.from(
      missingTranslations
    ).sort();
  }

  // -------------------------------------------
  // CLEANUP
  // -------------------------------------------

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;
    started = false;

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    translationIndex.clear();
    missingTranslations.clear();
  }

  return {
    start,
    refresh,
    getMissingTranslations,
    destroy
  };
}
