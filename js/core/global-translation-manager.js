
/**
 * LexBridge — Global Translation Manager
 * Version: 0.3.0
 *
 * Languages: EN / FR / DE
 *
 * Features:
 * - Existing locale dictionaries
 * - Known corporate workflow content
 * - Native select option translations
 * - Dynamic pagination and counters
 * - Dynamic workflow statuses
 * - MutationObserver for new UI elements
 * - Preserves form values and step status IDs
 * - Keeps legal document content untouched
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

const LANGUAGES = ["en", "fr", "de"];

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

/*
 * Explicit translations.
 *
 * Format:
 * [English, French, German]
 *
 * Translation entries must not change
 * the underlying legal workflow data.
 */

const CONTENT = [
  [
    "Verify company registration",
    "Vérifier l'inscription de la société",
    "Handelsregistereintrag der Gesellschaft prüfen"
  ],
  [
    "Check the company identity, legal form and current commercial register extract.",
    "Vérifier l'identité de la société, sa forme juridique et son extrait actuel du registre du commerce.",
    "Identität und Rechtsform der Gesellschaft sowie den aktuellen Handelsregisterauszug prüfen."
  ],
  [
    "Review articles of association",
    "Examiner les statuts de la société",
    "Statuten der Gesellschaft prüfen"
  ],
  [
    "Identify any relevant company-specific rules on corporate decisions and representation.",
    "Identifier les règles statutaires pertinentes relatives aux décisions sociales et à la représentation.",
    "Relevante statutarische Bestimmungen zu Gesellschaftsbeschlüssen und zur Vertretung feststellen."
  ],
  [
    "Identify the competent corporate body",
    "Identifier l'organe social compétent",
    "Zuständiges Gesellschaftsorgan bestimmen"
  ],
  [
    "Determine who has authority to decide the proposed change.",
    "Déterminer quel organe est compétent pour décider de la modification envisagée.",
    "Feststellen, welches Organ für den Beschluss über die geplante Änderung zuständig ist."
  ],
  [
    "Review supporting evidence",
    "Examiner les pièces justificatives",
    "Belege und Nachweise prüfen"
  ],
  [
    "Check the decision record and supporting documents appropriate to the change.",
    "Vérifier le procès-verbal de décision et les pièces justificatives correspondant à la modification.",
    "Beschlussprotokoll und die für die Änderung erforderlichen Belege prüfen."
  ],
  [
    "Check company representation",
    "Vérifier la représentation de la société",
    "Vertretung der Gesellschaft prüfen"
  ],
  [
    "Verify continuing representation arrangements and relevant signing powers.",
    "Vérifier les modalités de représentation en vigueur et les pouvoirs de signature correspondants.",
    "Die geltenden Vertretungsregelungen und die entsprechenden Zeichnungsberechtigungen prüfen."
  ],
  [
    "This workflow is preliminary and does not constitute legal advice.",
    "Cette procédure est préliminaire et ne constitue pas un avis juridique.",
    "Dieser Arbeitsablauf ist vorläufig und stellt keine Rechtsberatung dar."
  ],
  [
    "Check the current legislation and official cantonal registry instructions.",
    "Vérifiez la législation en vigueur et les instructions officielles du registre du commerce cantonal.",
    "Prüfen Sie die geltenden Rechtsvorschriften und die offiziellen Anweisungen des kantonalen Handelsregisteramts."
  ],
  [
    "The company's articles of association and the facts of the matter may change the procedure.",
    "Les statuts de la société et les circonstances du dossier peuvent modifier la procédure applicable.",
    "Die Statuten der Gesellschaft und der konkrete Sachverhalt können den erforderlichen Ablauf verändern."
  ],
  [
    "No documents are automatically filed or legally approved.",
    "Aucun document n'est automatiquement déposé ou juridiquement validé.",
    "Dokumente werden weder automatisch eingereicht noch rechtlich genehmigt."
  ],
  [
    "Legal source metadata for a prototype. Article applicability and current wording must be checked before legal use.",
    "Métadonnées des sources juridiques destinées à un prototype. L'applicabilité des articles et leur teneur actuelle doivent être vérifiées avant toute utilisation juridique.",
    "Rechtsquellen-Metadaten für einen Prototyp. Die Anwendbarkeit und der aktuelle Wortlaut der Bestimmungen müssen vor einer rechtlichen Verwendung geprüft werden."
  ],
  [
    "Swiss Code of Obligations",
    "Code des obligations suisse",
    "Schweizerisches Obligationenrecht"
  ],
  [
    "Commercial Register Ordinance",
    "Ordonnance sur le registre du commerce",
    "Handelsregisterverordnung"
  ],
  [
    "Central Business Name Index",
    "Index central des raisons de commerce",
    "Zentraler Firmenindex"
  ],
  [
    "Check company registration information and identify the competent commercial register.",
    "Vérifier les données d'inscription de la société et identifier le registre du commerce compétent.",
    "Handelsregisterangaben der Gesellschaft prüfen und das zuständige Handelsregisteramt ermitteln."
  ],
  [
    "Draft document only. The content must be reviewed and signed in accordance with the competent commercial registry's requirements",
    "Projet de document uniquement. Le contenu doit être vérifié et signé conformément aux exigences du registre du commerce compétent.",
    "Nur ein Dokumententwurf. Der Inhalt muss gemäss den Anforderungen des zuständigen Handelsregisteramts geprüft und unterzeichnet werden."
  ],
  [
    "Draft document only. The content must be reviewed and signed in accordance with the competent commercial registry's requirements.",
    "Projet de document uniquement. Le contenu doit être vérifié et signé conformément aux exigences du registre du commerce compétent.",
    "Nur ein Dokumententwurf. Der Inhalt muss gemäss den Anforderungen des zuständigen Handelsregisteramts geprüft und unterzeichnet werden."
  ],
  [
    "Workflow checklist",
    "Liste de contrôle juridique",
    "Rechtliche Checkliste"
  ],
  [
    "Official legal sources",
    "Sources juridiques officielles",
    "Offizielle Rechtsquellen"
  ],
  [
    "Document template",
    "Modèle de document",
    "Dokumentvorlage"
  ],
  [
    "Generate document draft",
    "Générer le projet de document",
    "Dokumententwurf erstellen"
  ],
  [
    "Pending review",
    "En attente de vérification",
    "Prüfung ausstehend"
  ],
  [
    "Review status",
    "État de la vérification",
    "Prüfstatus"
  ],
  [
    "Source IDs",
    "Identifiants des sources",
    "Quellenkennungen"
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
    "Export JSON",
    "Exporter en JSON",
    "JSON exportieren"
  ],
  [
    "Prototype",
    "Prototype",
    "Prototyp"
  ]
];

/*
 * Legacy text mappings.
 * The values refer to keys in locales/*.json.
 */

const LEGACY_KEYS = {
  "New Corporate Matter":
    "corporate.newMatter",

  "Edit Corporate Matter":
    "corporate.editMatter",

  "Cancel Editing":
    "corporate.cancelEditing",

  "Corporate Matter":
    "corporate.matterTitle",

  "Edit Matter Details":
    "corporate.editMatterDetails",

  "Company Information":
    "corporate.companyInformation",

  "Proposed Change":
    "corporate.proposedChange",

  "Person Details":
    "corporate.personDetails",

  "Confirm Information":
    "corporate.confirmInformation",

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

  "Workflow Overview":
    "workflow.overview",

  "Workflow Checklist":
    "workflow.checklist",

  "Official Legal Sources":
    "sections.sources",

  "Legal Considerations":
    "sections.warnings",

  "Document Generator":
    "sections.documents",

  "Generate Document Draft":
    "documents.generate",

  "Generate legal workflow":
    "corporate.generateWorkflow",

  "Back":
    "actions.back",

  "Continue":
    "actions.continue",

  "Finish":
    "actions.finish",

  "Export JSON":
    "workflow.exportJSON"
};

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

function flatten(value, prefix = "", output = {}) {
  if (!isObject(value)) return output;

  for (const [name, entry] of Object.entries(value)) {
    const key = prefix
      ? `${prefix}.${name}`
      : name;

    if (typeof entry === "string") {
      output[key] = entry;
    } else if (isObject(entry)) {
      flatten(entry, key, output);
    }
  }

  return output;
}

function getLanguageIndex() {
  const index = LANGUAGES.indexOf(
    getLanguage()
  );

  return index < 0 ? 0 : index;
}

function getTranslatedStatus(code) {
  const values = STATUS_TRANSLATIONS[code];

  return values
    ? values[getLanguageIndex()]
    : null;
}

function getTranslatedOperation(code) {
  const values =
    OPERATION_TRANSLATIONS[code];

  return values
    ? values[getLanguageIndex()]
    : null;
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

function translateStepCounter(current, total) {
  if (getLanguage() === "fr") {
    return `ÉTAPE ${current} SUR ${total}`;
  }

  if (getLanguage() === "de") {
    return `SCHRITT ${current} VON ${total}`;
  }

  return `STEP ${current} OF ${total}`;
}

/*
 * Preserve values when translating
 * status selects. Their .value properties
 * must remain pending/completed/etc.
 */
function isWorkflowStatusSelect(select) {
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

  if (!values.length) return false;

  return values.every(
    (value) => STATUS_CODES.includes(value)
  );
}

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

  let observer = null;
  let unsubscribe = null;
  let startPromise = null;

  let refreshQueued = false;
  let refreshing = false;

  const dictionaryIndex = new Map();
  const contentIndex = new Map();
  const nodeSources = new WeakMap();
  const missingTranslations = new Set();

  // -------------------------------------------
  // BUILD LOOKUP TABLES
  // -------------------------------------------

  async function buildIndex() {
    const dictionaries = await Promise.all(
      LANGUAGES.map((language) =>
        loadLanguage(language)
      )
    );

    dictionaryIndex.clear();
    contentIndex.clear();

    for (const dictionary of dictionaries) {
      const entries = flatten(dictionary);

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
          dictionaryIndex.set(value, key);
        }
      }
    }

    for (const [text, key] of Object.entries(
      LEGACY_KEYS
    )) {
      dictionaryIndex.set(
        normalize(text),
        key
      );
    }

    CONTENT.forEach((translations, id) => {
      for (const text of translations) {
        if (!text) continue;

        const normalized = normalize(text);

        if (!contentIndex.has(normalized)) {
          contentIndex.set(normalized, id);
        }
      }
    });
  }

  // -------------------------------------------
  // TRANSLATE DYNAMIC TEXT
  // -------------------------------------------

  function translateDynamic(value) {
    const text = normalize(value);
    const lang = getLanguageIndex();

    // Step 4 of 4
    let match = text.match(
      /^(?:STEP|ÉTAPE|SCHRITT)\s+(\d+)\s+(?:OF|SUR|VON)\s+(\d+)$/i
    );

    if (match) {
      return translateStepCounter(
        match[1],
        match[2]
      );
    }

    // Progress counters across languages.
    match = text.match(
      /^(\d+)\s+of\s+(\d+)\s+steps?\s+completed$/i
    );

    if (!match) {
      match = text.match(
        /^(\d+)\s+étapes?\s+terminées?\s+sur\s+(\d+)$/i
      );
    }

    if (!match) {
      match = text.match(
        /^(\d+)\s+von\s+(\d+)\s+Schritten?\s+abgeschlossen$/i
      );
    }

    if (match) {
      return t("workflow.progress", {
        completed: match[1],
        total: match[2]
      });
    }

    // Workflow page: 1–5 of 19 · Group 1 of 4
    match = text.match(
      /^(\d+)\s*[–-]\s*(\d+)\s+of\s+(\d+)\s*[·•|]\s*Group\s+(\d+)\s+of\s+(\d+)$/i
    );

    if (!match) {
      match = text.match(
        /^(\d+)\s*[–-]\s*(\d+)\s+sur\s+(\d+)\s*[·•|]\s*Groupe\s+(\d+)\s+sur\s+(\d+)$/i
      );
    }

    if (!match) {
      match = text.match(
        /^(\d+)\s*[–-]\s*(\d+)\s+von\s+(\d+)\s*[·•|]\s*Gruppe\s+(\d+)\s+von\s+(\d+)$/i
      );
    }

    if (match) {
      const [, first, last, total, group, groups] =
        match;

      if (lang === 1) {
        return (
          `${first}–${last} sur ${total}` +
          ` · Groupe ${group} sur ${groups}`
        );
      }

      if (lang === 2) {
        return (
          `${first}–${last} von ${total}` +
          ` · Gruppe ${group} von ${groups}`
        );
      }

      return (
        `${first}–${last} of ${total}` +
        ` · Group ${group} of ${groups}`
      );
    }

    // Standalone group counter.
    match = text.match(
      /^(?:Group|Groupe|Gruppe)\s+(\d+)\s+(?:of|sur|von)\s+(\d+)$/i
    );

    if (match) {
      return t("workflow.group", {
        current: match[1],
        total: match[2]
      });
    }

    // Status: pending_review
    match = text.match(
      /^(?:Status|Statut)\s*:\s*(pending_review|pending|completed|blocked|not_applicable)$/i
    );

    if (match) {
      const label = getTranslatedStatus(
        match[1].toLowerCase()
      );

      const prefix = lang === 1
        ? "Statut"
        : "Status";

      return `${prefix}: ${label}`;
    }

    // Already translated status.
    for (const translations of Object.values(
      STATUS_TRANSLATIONS
    )) {
      for (const existing of translations) {
        const existingText = text.match(
          /^(?:Status|Statut)\s*:\s*(.+)$/i
        );

        if (
          existingText &&
          existingText[1] === existing
        ) {
          return (
            `${lang === 1 ? "Statut" : "Status"}: ` +
            translations[lang]
          );
        }
      }
    }

    // Compact matter header.
    match = text.match(
      /^(SA|SARL)\s*[·•]\s*(VD|GE|ZH|BS)\s*[·•]\s*(appoint|remove|signature)$/i
    );

    if (match) {
      return (
        `${match[1]} · ${match[2]} · ` +
        getTranslatedOperation(
          match[3].toLowerCase()
        )
      );
    }

    // Previously translated compact header.
    match = text.match(
      /^(SA|SARL)\s*[·•]\s*(VD|GE|ZH|BS)\s*[·•]\s*(.+)$/i
    );

    if (match) {
      for (const translations of Object.values(
        OPERATION_TRANSLATIONS
      )) {
        if (translations.includes(match[3])) {
          return (
            `${match[1]} · ${match[2]} · ` +
            translations[lang]
          );
        }
      }
    }

    // Source IDs.
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

    // Relevant article numbers.
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

    // Arrow buttons.
    const arrows = text.match(
      /^(←\s*|\s*)(Previous|Précédent|Zurück|Next|Suivant|Weiter)(\s*→|\s*)$/i
    );

    if (arrows) {
      const word = arrows[2];

      const isNext = [
        "next",
        "suivant",
        "weiter"
      ].includes(word.toLowerCase());

      const labels = isNext
        ? ["Next", "Suivant", "Weiter"]
        : ["Previous", "Précédent", "Zurück"];

      const leftArrow = arrows[1].includes("←");
      const rightArrow = arrows[3].includes("→");

      return (
        (leftArrow ? "← " : "") +
        labels[lang] +
        (rightArrow ? " →" : "")
      );
    }

    // Sidebar fallback for an unresolved key.
    if (text === "app.prototype") {
      return ["Prototype", "Prototype", "Prototyp"][
        lang
      ];
    }

    return null;
  }

  // -------------------------------------------
  // TRANSLATE ANY RECOGNIZED UI TEXT
  // -------------------------------------------

  function translateValue(value) {
    const source = normalize(value);

    if (!source) return null;

    const dynamic = translateDynamic(source);

    if (dynamic !== null) {
      return dynamic;
    }

    const contentId = contentIndex.get(
      source
    );

    if (contentId !== undefined) {
      return CONTENT[contentId][
        getLanguageIndex()
      ];
    }

    const key = dictionaryIndex.get(
      source
    );

    if (!key) return null;

    const result = t(key);

    if (result === key) {
      missingTranslations.add(key);
      return null;
    }

    return result;
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
      !TEXT_TAGS.has(parent.tagName) ||
      isExcluded(parent)
    ) {
      return;
    }

    // Option nodes are handled separately.
    if (parent.tagName === "OPTION") {
      return;
    }

    const current = node.textContent || "";

    if (!normalize(current)) {
      return;
    }

    const remembered = nodeSources.get(node);

    const source =
      remembered &&
      remembered.rendered === current
        ? remembered.source
        : current;

    const result = translateValue(source);

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
  // NATIVE SELECT OPTIONS
  // -------------------------------------------

  function translateStatusSelect(select) {
    if (!isWorkflowStatusSelect(select)) {
      return;
    }

    // Keep the existing selected status.
    const selectedValue = select.value;
    const selectedIndex = select.selectedIndex;

    for (const option of select.options) {
      const translated = getTranslatedStatus(
        option.value
      );

      if (
        translated &&
        option.textContent !== translated
      ) {
        option.textContent = translated;
      }
    }

    // Option values remain unchanged.
    // Preserve selection in all browsers.
    if (select.value !== selectedValue) {
      select.value = selectedValue;
    }

    if (
      selectedValue === "" &&
      selectedIndex >= 0
    ) {
      select.selectedIndex = selectedIndex;
    }
  }

  function translateSelectOptions() {
    const selects = root.querySelectorAll(
      "select"
    );

    for (const select of selects) {
      translateStatusSelect(select);
    }
  }

  // -------------------------------------------
  // EXPLICIT DATA-I18N ATTRIBUTES
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

    if (
      key &&
      element.children.length === 0
    ) {
      const value = t(key);

      if (value !== key) {
        if (element.textContent !== value) {
          element.textContent = value;
        }
      } else {
        missingTranslations.add(key);
      }
    }

    const placeholderKey = element.getAttribute(
      "data-i18n-placeholder"
    );

    if (placeholderKey) {
      const value = t(placeholderKey);

      if (value !== placeholderKey) {
        element.setAttribute(
          "placeholder",
          value
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
      const value = t(titleKey);

      if (value !== titleKey) {
        element.setAttribute("title", value);
      } else {
        missingTranslations.add(titleKey);
      }
    }
  }

  // -------------------------------------------
  // REFRESH
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

    try {
      // Translate controls first.
      translateSelectOptions();

      const explicitSelector =
        "[data-i18n], " +
        "[data-i18n-placeholder], " +
        "[data-i18n-title]";

      const explicitElements = [];

      if (root.matches(explicitSelector)) {
        explicitElements.push(root);
      }

      explicitElements.push(
        ...root.querySelectorAll(
          explicitSelector
        )
      );

      for (const element of explicitElements) {
        translateExplicit(element);
      }

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
        translateTextNode(node);
      }
    } finally {
      refreshing = false;
    }
  }

  // -------------------------------------------
  // REFRESH QUEUE
  // -------------------------------------------

  function scheduleRefresh() {
    if (
      refreshQueued ||
      !started ||
      destroyed
    ) {
      return;
    }

    refreshQueued = true;

    queueMicrotask(() => {
      refreshQueued = false;

      if (destroyed) return;

      /*
       * Disconnect while writing translations.
       * This avoids observing our own changes
       * and creating a refresh loop.
       */
      if (observer) {
        observer.disconnect();
      }

      try {
        refresh();
      } finally {
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
    });
  }

  // -------------------------------------------
  // START
  // -------------------------------------------

  async function start() {
    if (destroyed) {
      throw new Error(
        "Translation Manager has been destroyed."
      );
    }

    if (started) return;

    if (startPromise) {
      return startPromise;
    }

    startPromise = (async () => {
      await buildIndex();

      if (destroyed || started) {
        return;
      }

      started = true;

      observer = new MutationObserver(
        scheduleRefresh
      );

      unsubscribe = onLanguageChange(
        scheduleRefresh
      );

      /*
       * First refresh is done before the
       * observer starts, preventing an
       * unnecessary mutation cycle.
       */
      refresh();

      observer.observe(root, {
        childList: true,
        characterData: true,
        subtree: true
      });
    })();

    try {
      await startPromise;
    } finally {
      startPromise = null;
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
  // DESTROY
  // -------------------------------------------

  function destroy() {
    if (destroyed) return;

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
    contentIndex.clear();
    missingTranslations.clear();
  }

  return {
    start,
    refresh,
    getMissingTranslations,
    destroy
  };
}
