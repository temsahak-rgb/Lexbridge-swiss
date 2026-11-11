
/**
 * LexBridge — Global Translation Manager
 * Version: 0.4.0
 *
 * Centralized EN / FR / DE interface translation.
 *
 * Sources:
 * 1. locales/en.json, fr.json, de.json
 * 2. locales/legal-content.json
 * 3. Legacy interface aliases
 * 4. Dynamic interface patterns
 *
 * Features:
 * - Automatically discovers translations in JSON
 * - Supports nested legal translation groups
 * - Translates dynamically inserted UI
 * - Translates native status-select options
 * - Preserves select values and user inputs
 * - Supports workflow counters and pagination
 * - Does not regenerate legal workflows
 * - Does not intentionally translate documents
 * - Graceful fallback if legal JSON is unavailable
 *
 * No external APIs or dependencies.
 */

"use strict";

import {
  t,
  getLanguage,
  loadLanguage,
  onLanguageChange
} from "./i18n.js";

// ---------------------------------------------
// CONFIGURATION
// ---------------------------------------------

const LANGUAGES = [
  "en",
  "fr",
  "de"
];

const EXCLUDED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "INPUT",
  "CODE",
  "PRE",
  "SVG",
  "CANVAS"
]);

const TEXT_TAGS = new Set([
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

const STATUS_CODES = [
  "pending",
  "completed",
  "blocked",
  "not_applicable"
];

const STATUS_TRANSLATIONS = {
  pending_review: [
    "Pending review",
    "En attente de vérification",
    "Prüfung ausstehend"
  ],

  pending: [
    "Pending",
    "En attente",
    "Ausstehend"
  ],

  completed: [
    "Completed",
    "Terminé",
    "Abgeschlossen"
  ],

  blocked: [
    "Blocked",
    "Bloqué",
    "Blockiert"
  ],

  not_applicable: [
    "Not applicable",
    "Sans objet",
    "Nicht anwendbar"
  ]
};

const OPERATION_TRANSLATIONS = {
  appoint: [
    "Appointment",
    "Nomination",
    "Wahl oder Ernennung"
  ],

  remove: [
    "Removal or resignation",
    "Révocation ou démission",
    "Abberufung oder Rücktritt"
  ],

  signature: [
    "Change of signing authority",
    "Modification du pouvoir de signature",
    "Änderung der Zeichnungsberechtigung"
  ]
};

// ---------------------------------------------
// LEGACY INTERFACE ALIASES
// ---------------------------------------------

/**
 * Maps old English UI strings to existing
 * locale keys.
 *
 * These aliases are for interface text.
 * Legal content now comes from JSON.
 */

const LEGACY_KEYS = {
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

  "Workflow":
    "sections.workflow",

  "Workflow Overview":
    "workflow.overview",

  "Workflow checklist":
    "workflow.checklist",

  "Workflow Checklist":
    "workflow.checklist",

  "Legal Considerations":
    "sections.warnings",

  "Official legal sources":
    "sections.sources",

  "Official Legal Sources":
    "sections.sources",

  "Document Generator":
    "sections.documents",

  "Document template":
    "documents.template",

  "Generate document draft":
    "documents.generate",

  "Generate Document Draft":
    "documents.generate",

  "Generate legal workflow":
    "corporate.generateWorkflow",

  "Review status":
    "workflow.stepStatus",

  "Source IDs":
    "workflow.sourceIds",

  "Dataset review date":
    "legal.datasetReviewDate",

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

  "Export JSON":
    "workflow.exportJSON"
};

// ---------------------------------------------
// SMALL UI TRANSLATIONS
// ---------------------------------------------

/**
 * Only interface-level strings remain here.
 *
 * Workflow titles, descriptions, warnings,
 * source titles and document disclaimers
 * must be maintained in legal-content.json.
 */

const INTERFACE_TERMS = [
  [
    "Pending review",
    "En attente de vérification",
    "Prüfung ausstehend"
  ],
  [
    "Pending",
    "En attente",
    "Ausstehend"
  ],
  [
    "Completed",
    "Terminé",
    "Abgeschlossen"
  ],
  [
    "Blocked",
    "Bloqué",
    "Blockiert"
  ],
  [
    "Not applicable",
    "Sans objet",
    "Nicht anwendbar"
  ],
  [
    "Previous",
    "Précédent",
    "Zurück"
  ],
  [
    "Next",
    "Suivant",
    "Weiter"
  ],
  [
    "Prototype",
    "Prototype",
    "Prototyp"
  ],
  [
    "Relevant articles to review",
    "Articles pertinents à examiner",
    "Zu prüfende Artikel"
  ],
  [
    "Dataset review date",
    "Date de révision des données",
    "Datum der Datenüberprüfung"
  ],
  [
    "Source IDs",
    "Identifiants des sources",
    "Quellenkennungen"
  ]
];

// ---------------------------------------------
// UTILITIES
// ---------------------------------------------

function normalize(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getLanguageIndex() {
  const index = LANGUAGES.indexOf(
    getLanguage()
  );

  return index < 0 ? 0 : index;
}

function flattenDictionary(
  value,
  prefix = "",
  output = {}
) {
  if (!isObject(value)) {
    return output;
  }

  for (const [name, entry] of Object.entries(
    value
  )) {
    const key = prefix
      ? `${prefix}.${name}`
      : name;

    if (typeof entry === "string") {
      output[key] = entry;
    } else if (isObject(entry)) {
      flattenDictionary(
        entry,
        key,
        output
      );
    }
  }

  return output;
}

/**
 * Detect multilingual leaf objects:
 *
 * {
 *   en: "...",
 *   fr: "...",
 *   de: "..."
 * }
 *
 * Other objects are treated as folders.
 */

function isTranslationEntry(value) {
  return (
    isObject(value) &&
    typeof value.en === "string" &&
    typeof value.fr === "string" &&
    typeof value.de === "string"
  );
}

/**
 * Discover translation entries at any depth.
 *
 * This allows new workflow groups to be
 * added without changing the engine.
 */

function collectLegalTranslations(
  value,
  prefix = "",
  output = []
) {
  if (!isObject(value)) {
    return output;
  }

  if (isTranslationEntry(value)) {
    output.push({
      key: prefix,
      translations: [
        value.en,
        value.fr,
        value.de
      ]
    });

    return output;
  }

  for (const [name, child] of Object.entries(
    value
  )) {
    if (
      name === "metadata" ||
      name === "__proto__" ||
      name === "constructor" ||
      name === "prototype"
    ) {
      continue;
    }

    const path = prefix
      ? `${prefix}.${name}`
      : name;

    collectLegalTranslations(
      child,
      path,
      output
    );
  }

  return output;
}

function isExcluded(element) {
  let current = element;

  while (current) {
    if (
      EXCLUDED_TAGS.has(current.tagName) ||
      current.isContentEditable ||
      current.hasAttribute?.(
        "data-i18n-ignore"
      ) ||
      current.hasAttribute?.(
        "data-legal-document"
      )
    ) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function getStatus(code) {
  const translations =
    STATUS_TRANSLATIONS[code];

  return translations
    ? translations[getLanguageIndex()]
    : null;
}

function getOperation(code) {
  const translations =
    OPERATION_TRANSLATIONS[code];

  return translations
    ? translations[getLanguageIndex()]
    : null;
}

// ---------------------------------------------
// GLOBAL TRANSLATION MANAGER
// ---------------------------------------------

export function createGlobalTranslationManager({
  root = document.body
} = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error(
      "A valid translation root is required."
    );
  }

  let started = false;
  let destroyed = false;
  let starting = null;

  let observer = null;
  let unsubscribe = null;

  let refreshQueued = false;
  let refreshing = false;

  const dictionaryIndex = new Map();
  const legalIndex = new Map();
  const interfaceIndex = new Map();

  const nodeSources = new WeakMap();
  const missingTranslations = new Set();

  // -------------------------------------------
  // BUILD INDEXES
  // -------------------------------------------

  function buildInterfaceIndex() {
    interfaceIndex.clear();

    for (const terms of INTERFACE_TERMS) {
      for (const text of terms) {
        const value = normalize(text);

        if (
          value &&
          !interfaceIndex.has(value)
        ) {
          interfaceIndex.set(
            value,
            terms
          );
        }
      }
    }
  }

  async function buildDictionaryIndex() {
    const dictionaries = await Promise.all(
      LANGUAGES.map(
        (language) =>
          loadLanguage(language)
      )
    );

    dictionaryIndex.clear();

    for (const dictionary of dictionaries) {
      const entries = flattenDictionary(
        dictionary
      );

      for (const [key, text] of Object.entries(
        entries
      )) {
        const value = normalize(text);

        if (
          !value ||
          value.includes("{{")
        ) {
          continue;
        }

        if (!dictionaryIndex.has(value)) {
          dictionaryIndex.set(
            value,
            key
          );
        }
      }
    }

    // Explicit aliases override ambiguous
    // automatic dictionary matches.
    for (const [text, key] of Object.entries(
      LEGACY_KEYS
    )) {
      dictionaryIndex.set(
        normalize(text),
        key
      );
    }
  }

  /**
   * Load legal translations from the new
   * external JSON file.
   *
   * URL is relative to this JS module:
   *
   * js/core/global-translation-manager.js
   *                ->
   * locales/legal-content.json
   */

  async function buildLegalIndex() {
    legalIndex.clear();

    const url = new URL(
      "../../locales/legal-content.json",
      import.meta.url
    );

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (!isObject(data)) {
        throw new Error(
          "Legal translations must be a JSON object."
        );
      }

      const entries =
        collectLegalTranslations(data);

      for (const entry of entries) {
        const translations =
          entry.translations;

        for (const text of translations) {
          const value = normalize(text);

          if (!value) continue;

          // Keep the first matching legal
          // entry if duplicates exist.
          if (!legalIndex.has(value)) {
            legalIndex.set(
              value,
              translations
            );
          }
        }
      }

    } catch (error) {
      // Do not disable ordinary UI translation
      // if legal-content.json is unavailable.
      console.warn(
        "[LexBridge i18n] Unable to load " +
        "legal-content.json:",
        error
      );
    }
  }

  // -------------------------------------------
  // DYNAMIC TEXT
  // -------------------------------------------

  function translateDynamic(value) {
    const text = normalize(value);
    const lang = getLanguageIndex();

    let match;

    // Wizard step counter.
    match = text.match(
      /^(?:STEP|ÉTAPE|SCHRITT)\s+(\d+)\s+(?:OF|SUR|VON)\s+(\d+)$/i
    );

    if (match) {
      if (lang === 1) {
        return `ÉTAPE ${match[1]} SUR ${match[2]}`;
      }

      if (lang === 2) {
        return `SCHRITT ${match[1]} VON ${match[2]}`;
      }

      return `STEP ${match[1]} OF ${match[2]}`;
    }

    // Workflow progress in three languages.
    const progressPatterns = [
      /^(\d+)\s+of\s+(\d+)\s+steps?\s+completed$/i,
      /^(\d+)\s+étapes?\s+terminées?\s+sur\s+(\d+)$/i,
      /^(\d+)\s+von\s+(\d+)\s+Schritten?\s+abgeschlossen$/i
    ];

    for (const pattern of progressPatterns) {
      match = text.match(pattern);

      if (match) {
        return t(
          "workflow.progress",
          {
            completed: match[1],
            total: match[2]
          }
        );
      }
    }

    // Paginated checklist:
    // 1–5 of 19 · Group 1 of 4
    const paginationPatterns = [
      /^(\d+)\s*[–-]\s*(\d+)\s+of\s+(\d+)\s*[·•|]\s*Group\s+(\d+)\s+of\s+(\d+)$/i,
      /^(\d+)\s*[–-]\s*(\d+)\s+sur\s+(\d+)\s*[·•|]\s*Groupe\s+(\d+)\s+sur\s+(\d+)$/i,
      /^(\d+)\s*[–-]\s*(\d+)\s+von\s+(\d+)\s*[·•|]\s*Gruppe\s+(\d+)\s+von\s+(\d+)$/i
    ];

    for (const pattern of paginationPatterns) {
      match = text.match(pattern);

      if (!match) continue;

      const [
        ,
        first,
        last,
        total,
        group,
        groupTotal
      ] = match;

      if (lang === 1) {
        return (
          `${first}–${last} sur ${total}` +
          ` · Groupe ${group} sur ${groupTotal}`
        );
      }

      if (lang === 2) {
        return (
          `${first}–${last} von ${total}` +
          ` · Gruppe ${group} von ${groupTotal}`
        );
      }

      return (
        `${first}–${last} of ${total}` +
        ` · Group ${group} of ${groupTotal}`
      );
    }

    // Standalone group counter.
    match = text.match(
      /^(?:Group|Groupe|Gruppe)\s+(\d+)\s+(?:of|sur|von)\s+(\d+)$/i
    );

    if (match) {
      const groupWords = [
        "Group",
        "Groupe",
        "Gruppe"
      ];

      const joinWords = [
        "of",
        "sur",
        "von"
      ];

      return (
        `${groupWords[lang]} ${match[1]} ` +
        `${joinWords[lang]} ${match[2]}`
      );
    }

    // Internal status codes.
    match = text.match(
      /^(?:Status|Statut)\s*:\s*(pending_review|pending|completed|blocked|not_applicable)$/i
    );

    if (match) {
      const label = getStatus(
        match[1].toLowerCase()
      );

      const prefix = lang === 1
        ? "Statut"
        : "Status";

      return `${prefix}: ${label}`;
    }

    // Already translated status labels.
    match = text.match(
      /^(Status|Statut)\s*:\s*(.+)$/i
    );

    if (match) {
      for (const translations of Object.values(
        STATUS_TRANSLATIONS
      )) {
        if (
          translations.includes(
            match[2]
          )
        ) {
          const prefix = lang === 1
            ? "Statut"
            : "Status";

          return (
            `${prefix}: ` +
            translations[lang]
          );
        }
      }
    }

    // Matter legal scope.
    match = text.match(
      /^(SA|SARL)\s*[·•]\s*(VD|GE|ZH|BS)\s*[·•]\s*(appoint|remove|signature)$/i
    );

    if (match) {
      return (
        `${match[1]} · ${match[2]} · ` +
        getOperation(
          match[3].toLowerCase()
        )
      );
    }

    // Already localized operation.
    match = text.match(
      /^(SA|SARL)\s*[·•]\s*(VD|GE|ZH|BS)\s*[·•]\s*(.+)$/
    );

    if (match) {
      for (const translations of Object.values(
        OPERATION_TRANSLATIONS
      )) {
        if (
          translations.includes(
            match[3]
          )
        ) {
          return (
            `${match[1]} · ${match[2]} · ` +
            translations[lang]
          );
        }
      }
    }

    // Source IDs: preserve identifiers.
    match = text.match(
      /^(?:Source IDs|Identifiants des sources|Quellenkennungen)\s*:\s*(.+)$/i
    );

    if (match) {
      return (
        t("workflow.sourceIds") +
        ": " +
        match[1]
      );
    }

    // Dataset review date.
    match = text.match(
      /^(?:Dataset review date|Date de révision des données|Datum der Datenüberprüfung)\s*:\s*(\d{4}-\d{2}-\d{2})$/i
    );

    if (match) {
      return (
        t("legal.datasetReviewDate") +
        ": " +
        match[1]
      );
    }

    // Article list. Keep article numbers.
    match = text.match(
      /^(?:Relevant articles to review|Articles pertinents à examiner|Zu prüfende Artikel)\s*:\s*([\d,\s]+)$/i
    );

    if (match) {
      const labels = [
        "Relevant articles to review",
        "Articles pertinents à examiner",
        "Zu prüfende Artikel"
      ];

      return (
        labels[lang] +
        ": " +
        match[1].trim()
      );
    }

    // Pagination buttons with arrows.
    match = text.match(
      /^(←\s*)?(Previous|Précédent|Zurück|Next|Suivant|Weiter)(\s*→)?$/i
    );

    if (match) {
      const nextWords = [
        "next",
        "suivant",
        "weiter"
      ];

      const isNext = nextWords.includes(
        match[2].toLowerCase()
      );

      const translated = isNext
        ? ["Next", "Suivant", "Weiter"][lang]
        : ["Previous", "Précédent", "Zurück"][lang];

      return (
        (match[1] ? "← " : "") +
        translated +
        (match[3] ? " →" : "")
      );
    }

    // Legacy unresolved prototype key.
    if (text === "app.prototype") {
      return [
        "Prototype",
        "Prototype",
        "Prototyp"
      ][lang];
    }

    return null;
  }

  // -------------------------------------------
  // RESOLVE TRANSLATION
  // -------------------------------------------

  function translateValue(value) {
    const source = normalize(value);

    if (!source) {
      return null;
    }

    // 1. Dynamic values and counters.
    const dynamic = translateDynamic(
      source
    );

    if (dynamic !== null) {
      return dynamic;
    }

    // 2. Reviewed legal translations.
    const legal = legalIndex.get(
      source
    );

    if (legal) {
      return legal[
        getLanguageIndex()
      ];
    }

    // 3. Small fixed interface terms.
    const interfaceTerms = interfaceIndex.get(
      source
    );

    if (interfaceTerms) {
      return interfaceTerms[
        getLanguageIndex()
      ];
    }

    // 4. Existing locale dictionaries.
    const key = dictionaryIndex.get(
      source
    );

    if (!key) {
      return null;
    }

    const translated = t(key);

    if (translated === key) {
      missingTranslations.add(key);
      return null;
    }

    return translated;
  }

  // -------------------------------------------
  // TEXT NODE TRANSLATION
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
      !TEXT_TAGS.has(
        parent.tagName
      ) ||
      isExcluded(parent)
    ) {
      return;
    }

    // Select options are handled separately.
    if (parent.tagName === "OPTION") {
      return;
    }

    const current = node.textContent || "";

    if (!normalize(current)) {
      return;
    }

    const remembered =
      nodeSources.get(node);

    const source =
      remembered &&
      remembered.rendered === current
        ? remembered.source
        : current;

    const result =
      translateValue(source);

    if (result === null) {
      return;
    }

    const leading =
      current.match(/^\s*/)?.[0] || "";

    const trailing =
      current.match(/\s*$/)?.[0] || "";

    const next =
      leading + result + trailing;

    nodeSources.set(node, {
      source: normalize(source),
      rendered: next
    });

    if (current !== next) {
      node.textContent = next;
    }
  }

  // -------------------------------------------
  // STATUS SELECT TRANSLATION
  // -------------------------------------------

  function isStatusSelect(select) {
    if (
      !(select instanceof HTMLSelectElement) ||
      isExcluded(select)
    ) {
      return false;
    }

    const values = Array.from(
      select.options,
      (option) => option.value
    );

    return (
      values.length > 0 &&
      values.every(
        (value) =>
          STATUS_CODES.includes(
            value
          )
      )
    );
  }

  function translateStatusSelect(select) {
    if (!isStatusSelect(select)) {
      return;
    }

    const selectedValue =
      select.value;

    const selectedIndex =
      select.selectedIndex;

    for (const option of select.options) {
      const translation = getStatus(
        option.value
      );

      if (
        translation &&
        option.textContent !== translation
      ) {
        option.textContent =
          translation;
      }
    }

    // Ensure no status is changed.
    if (
      select.value !== selectedValue
    ) {
      select.value = selectedValue;
    }

    if (
      selectedValue === "" &&
      selectedIndex >= 0
    ) {
      select.selectedIndex =
        selectedIndex;
    }
  }

  function translateSelectOptions() {
    for (const select of root.querySelectorAll(
      "select"
    )) {
      translateStatusSelect(
        select
      );
    }
  }

  // -------------------------------------------
  // EXPLICIT TRANSLATION ATTRIBUTES
  // -------------------------------------------

  function translateExplicit(element) {
    if (
      !(element instanceof HTMLElement) ||
      isExcluded(element)
    ) {
      return;
    }

    const key = element.getAttribute(
      "data-i18n"
    );

    // Never replace complex element contents.
    // That could remove form controls.
    if (
      key &&
      element.children.length === 0
    ) {
      const value = t(key);

      if (value !== key) {
        if (
          element.textContent !== value
        ) {
          element.textContent = value;
        }
      } else {
        missingTranslations.add(
          key
        );
      }
    }

    const placeholderKey =
      element.getAttribute(
        "data-i18n-placeholder"
      );

    if (placeholderKey) {
      const value = t(
        placeholderKey
      );

      if (value !== placeholderKey) {
        if (
          element.getAttribute(
            "placeholder"
          ) !== value
        ) {
          element.setAttribute(
            "placeholder",
            value
          );
        }
      } else {
        missingTranslations.add(
          placeholderKey
        );
      }
    }

    const titleKey =
      element.getAttribute(
        "data-i18n-title"
      );

    if (titleKey) {
      const value = t(
        titleKey
      );

      if (value !== titleKey) {
        if (
          element.getAttribute(
            "title"
          ) !== value
        ) {
          element.setAttribute(
            "title",
            value
          );
        }
      } else {
        missingTranslations.add(
          titleKey
        );
      }
    }
  }

  // -------------------------------------------
  // REFRESH TRANSLATIONS
  // -------------------------------------------

  function refresh() {
    if (
      !started ||
      destroyed ||
      refreshing
    ) {
      return;
    }

    refreshing = true;

    // Temporarily stop observing our own
    // translation-related DOM mutations.
    if (observer) {
      observer.disconnect();
    }

    try {
      // Translate native status controls.
      translateSelectOptions();

      const selector = [
        "[data-i18n]",
        "[data-i18n-placeholder]",
        "[data-i18n-title]"
      ].join(", ");

      const explicitElements = [];

      if (root.matches(selector)) {
        explicitElements.push(
          root
        );
      }

      explicitElements.push(
        ...root.querySelectorAll(
          selector
        )
      );

      for (const element of explicitElements) {
        translateExplicit(
          element
        );
      }

      // Translate recognized visible text.
      const walker = document.createTreeWalker(
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
        translateTextNode(
          node
        );
      }

    } finally {
      refreshing = false;

      if (
        observer &&
        !destroyed
      ) {
        observer.observe(root, {
          childList: true,
          characterData: true,
          subtree: true
        });
      }
    }
  }

  // -------------------------------------------
  // SCHEDULE REFRESH
  // -------------------------------------------

  function scheduleRefresh() {
    if (
      destroyed ||
      !started ||
      refreshQueued
    ) {
      return;
    }

    refreshQueued = true;

    queueMicrotask(() => {
      refreshQueued = false;

      if (!destroyed) {
        refresh();
      }
    });
  }

  // -------------------------------------------
  // START
  // -------------------------------------------

  async function start() {
    if (destroyed) {
      throw new Error(
        "Translation Manager was destroyed."
      );
    }

    if (started) {
      return;
    }

    if (starting) {
      return starting;
    }

    starting = (async () => {
      // Core UI dictionaries must load.
      await buildDictionaryIndex();

      // Other indexes have no dependencies.
      buildInterfaceIndex();

      // Legal translations are optional
      // for successful app initialization.
      await buildLegalIndex();

      if (
        destroyed ||
        started
      ) {
        return;
      }

      started = true;

      observer = new MutationObserver(
        scheduleRefresh
      );

      unsubscribe =
        onLanguageChange(
          scheduleRefresh
        );

      // Initial translation before observing.
      refresh();

      observer.observe(root, {
        childList: true,
        characterData: true,
        subtree: true
      });
    })();

    try {
      await starting;
    } finally {
      starting = null;
    }
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

    dictionaryIndex.clear();
    legalIndex.clear();
    interfaceIndex.clear();
    missingTranslations.clear();
  }

  return {
    start,
    refresh,
    getMissingTranslations,
    destroy
  };
}
