
/**
 * LexBridge — Global Translation Manager
 * Version: 0.2.0
 *
 * Central translation layer for:
 * - English / French / German
 * - Legacy interface text
 * - Corporate workflow labels
 * - Known legal checklist content
 * - Official source descriptions
 * - Document generator controls
 * - Dynamic counters and status labels
 *
 * Keeps legal IDs, dates, form values and
 * generated legal documents unchanged.
 *
 * No translation API or external libraries.
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
  "SELECT",
  "CODE",
  "PRE",
  "SVG"
]);

const ALLOWED_TAGS = new Set([
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

/**
 * Existing English text that differs
 * from the standard en.json wording.
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
    "documents.generate"
};

/**
 * Reviewed interface and workflow
 * translations.
 *
 * Each entry:
 * [English, French, German]
 *
 * These are UI display translations.
 * They do not alter the workflow JSON.
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
    "Generate document draft",
    "Générer le projet de document",
    "Dokumententwurf erstellen"
  ],
  [
    "Document template",
    "Modèle de document",
    "Dokumentvorlage"
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
    "Pending review",
    "En attente de vérification",
    "Prüfung ausstehend"
  ]
];

const STATUS_LABELS = {
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

const OPERATION_LABELS = {
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

function languageIndex() {
  const index = LANGUAGES.indexOf(
    getLanguage()
  );

  return index < 0 ? 0 : index;
}

function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function flatten(
  value,
  prefix = "",
  output = {}
) {
  if (!isObject(value)) {
    return output;
  }

  for (const [name, entry] of Object.entries(value)) {
    const key = prefix
      ? prefix + "." + name
      : name;

    if (typeof entry === "string") {
      output[key] = entry;
    } else if (isObject(entry)) {
      flatten(entry, key, output);
    }
  }

  return output;
}

function isExcluded(element) {
  let current = element;

  while (current) {
    if (
      EXCLUDED_TAGS.has(current.tagName) ||
      current.isContentEditable ||
      current.hasAttribute?.("data-i18n-ignore") ||
      current.hasAttribute?.("data-legal-document")
    ) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function formatCounter(current, total) {
  const index = languageIndex();

  if (index === 1) {
    return `ÉTAPE ${current} SUR ${total}`;
  }

  if (index === 2) {
    return `SCHRITT ${current} VON ${total}`;
  }

  return `STEP ${current} OF ${total}`;
}

function formatProgress(completed, total) {
  return t("workflow.progress", {
    completed,
    total
  });
}

function formatStatus(code) {
  const labels = STATUS_LABELS[code];

  if (!labels) {
    return null;
  }

  return labels[languageIndex()];
}

function formatOperation(code) {
  const labels = OPERATION_LABELS[code];

  return labels
    ? labels[languageIndex()]
    : code;
}

/**
 * Central translator.
 */
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
  let queued = false;
  let startPromise = null;

  const index = new Map();
  const contentIndex = new Map();
  const nodeSources = new WeakMap();
  const missing = new Set();

  // -----------------------------------------
  // DICTIONARY INDEX
  // -----------------------------------------

  async function buildIndex() {
    const dictionaries = await Promise.all(
      LANGUAGES.map((language) =>
        loadLanguage(language)
      )
    );

    index.clear();
    contentIndex.clear();

    const flattened = dictionaries.map(
      (dictionary) => flatten(dictionary)
    );

    // Prefer English as the canonical
    // source of a translation key.
    for (const dictionary of flattened) {
      for (const [key, text] of Object.entries(
        dictionary
      )) {
        const value = normalize(text);

        if (
          !value ||
          value.includes("{{")
        ) {
          continue;
        }

        if (!index.has(value)) {
          index.set(value, key);
        }
      }
    }

    for (const [text, key] of Object.entries(
      LEGACY_KEYS
    )) {
      index.set(normalize(text), key);
    }

    CONTENT.forEach((translations, id) => {
      for (const text of translations) {
        const value = normalize(text);

        if (!value) continue;

        if (!contentIndex.has(value)) {
          contentIndex.set(value, id);
        }
      }
    });
  }

  // -----------------------------------------
  // DYNAMIC TEXT PATTERNS
  // -----------------------------------------

  function translateDynamic(value) {
    const text = normalize(value);
    const lang = languageIndex();

    // Wizard counter: STEP 4 OF 4
    let match = text.match(
      /^(?:STEP|ÉTAPE|SCHRITT)\s+(\d+)\s+(?:OF|SUR|VON)\s+(\d+)$/i
    );

    if (match) {
      return formatCounter(
        match[1],
        match[2]
      );
    }

    // Workflow progress.
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
      return formatProgress(
        match[1],
        match[2]
      );
    }

    // Workflow status with internal code.
    match = text.match(
      /^(?:Status|Statut)\s*:\s*(pending_review|pending|completed|blocked|not_applicable)$/i
    );

    if (match) {
      const translated = formatStatus(
        match[1].toLowerCase()
      );

      const prefix = [
        "Status",
        "Statut",
        "Status"
      ][lang];

      return `${prefix}: ${translated}`;
    }

    // Already-localized workflow status.
    for (const labels of Object.values(
      STATUS_LABELS
    )) {
      for (const label of labels) {
        const prefixes = [
          "Status",
          "Statut"
        ];

        for (const prefix of prefixes) {
          if (text === `${prefix}: ${label}`) {
            return [
              "Status",
              "Statut",
              "Status"
            ][lang] + ": " + labels[lang];
          }
        }
      }
    }

    // Compact legal-scope summary.
    // Preserve company type and canton codes.
    match = text.match(
      /^(SA|SARL)\s*[·•]\s*(VD|GE|ZH|BS)\s*[·•]\s*(appoint|remove|signature)$/i
    );

    if (match) {
      return (
        `${match[1]} · ${match[2]} · ` +
        formatOperation(match[3])
      );
    }

    // Also recognize translated operations
    // when the interface language changes again.
    match = text.match(
      /^(SA|SARL)\s*[·•]\s*(VD|GE|ZH|BS)\s*[·•]\s*(.+)$/
    );

    if (match) {
      for (const labels of Object.values(
        OPERATION_LABELS
      )) {
        if (labels.includes(match[3])) {
          return (
            `${match[1]} · ${match[2]} · ` +
            labels[lang]
          );
        }
      }
    }

    // Source IDs: CH-CO
    // Translate the label only, not the ID.
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
    // Preserve the original date value.
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

    // Article list.
    // Preserve article numbers.
    match = text.match(
      /^(?:Relevant articles to review|Articles pertinents à examiner|Zu prüfende Artikel)\s*:\s*([\d,\s]+)$/i
    );

    if (match) {
      const label = [
        "Relevant articles to review",
        "Articles pertinents à examiner",
        "Zu prüfende Artikel"
      ][lang];

      return label + ": " + match[1].trim();
    }

    return null;
  }

  // -----------------------------------------
  // TRANSLATE KNOWN TEXT
  // -----------------------------------------

  function translateValue(value) {
    const original = normalize(value);

    if (!original) {
      return null;
    }

    const dynamic = translateDynamic(original);

    if (dynamic !== null) {
      return dynamic;
    }

    const contentId = contentIndex.get(
      original
    );

    if (contentId !== undefined) {
      return CONTENT[contentId][
        languageIndex()
      ];
    }

    const key = index.get(original);

    if (!key) {
      return null;
    }

    const result = t(key);

    if (result === key) {
      missing.add(key);
      return null;
    }

    return result;
  }

  // -----------------------------------------
  // INDIVIDUAL TEXT NODES
  // -----------------------------------------

  function translateNode(node) {
    if (
      !node ||
      node.nodeType !== Node.TEXT_NODE
    ) {
      return;
    }

    const parent = node.parentElement;

    if (
      !parent ||
      !ALLOWED_TAGS.has(parent.tagName) ||
      isExcluded(parent)
    ) {
      return;
    }

    const current = node.textContent || "";

    if (!normalize(current)) {
      return;
    }

    const remembered = nodeSources.get(node);

    let source = current;

    if (
      remembered &&
      current === remembered.rendered
    ) {
      source = remembered.source;
    }

    const result = translateValue(source);

    if (result === null) {
      return;
    }

    const leading =
      current.match(/^\s*/)?.[0] || "";

    const trailing =
      current.match(/\s*$/)?.[0] || "";

    const next = leading + result + trailing;

    nodeSources.set(node, {
      source: normalize(source),
      rendered: next
    });

    if (current !== next) {
      node.textContent = next;
    }
  }

  // -----------------------------------------
  // EXPLICIT TRANSLATION ATTRIBUTES
  // -----------------------------------------

  function translateAttributes(element) {
    if (
      !(element instanceof HTMLElement) ||
      isExcluded(element)
    ) {
      return;
    }

    const key = element.getAttribute(
      "data-i18n"
    );

    // Only replace leaf element content.
    // Replacing complex elements would
    // destroy controls and event listeners.
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
        missing.add(key);
      }
    }

    const placeholderKey =
      element.getAttribute(
        "data-i18n-placeholder"
      );

    if (placeholderKey) {
      const value = t(placeholderKey);

      if (value !== placeholderKey) {
        if (
          element.getAttribute("placeholder") !==
          value
        ) {
          element.setAttribute(
            "placeholder",
            value
          );
        }
      } else {
        missing.add(placeholderKey);
      }
    }

    const titleKey = element.getAttribute(
      "data-i18n-title"
    );

    if (titleKey) {
      const value = t(titleKey);

      if (value !== titleKey) {
        if (
          element.getAttribute("title") !== value
        ) {
          element.setAttribute(
            "title",
            value
          );
        }
      } else {
        missing.add(titleKey);
      }
    }
  }

  // -----------------------------------------
  // FULL UI SCAN
  // -----------------------------------------

  function refresh() {
    if (!started || destroyed) {
      return;
    }

    const elements = [];

    if (
      root.matches(
        "[data-i18n], " +
        "[data-i18n-placeholder], " +
        "[data-i18n-title]"
      )
    ) {
      elements.push(root);
    }

    elements.push(
      ...root.querySelectorAll(
        "[data-i18n], " +
        "[data-i18n-placeholder], " +
        "[data-i18n-title]"
      )
    );

    for (const element of elements) {
      translateAttributes(element);
    }

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    for (const node of nodes) {
      translateNode(node);
    }
  }

  // -----------------------------------------
  // COALESCED REFRESH
  // -----------------------------------------

  function scheduleRefresh() {
    if (
      queued ||
      !started ||
      destroyed
    ) {
      return;
    }

    queued = true;

    queueMicrotask(() => {
      queued = false;

      if (!destroyed) {
        refresh();
      }
    });
  }

  // -----------------------------------------
  // INITIALIZATION
  // -----------------------------------------

  async function start() {
    if (destroyed) {
      throw new Error(
        "Translation Manager is destroyed."
      );
    }

    if (started) {
      return;
    }

    if (startPromise) {
      return startPromise;
    }

    startPromise = (async () => {
      await buildIndex();

      if (destroyed || started) {
        return;
      }

      started = true;

      refresh();

      unsubscribe = onLanguageChange(
        scheduleRefresh
      );

      observer = new MutationObserver(
        scheduleRefresh
      );

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

  // -----------------------------------------
  // DIAGNOSTICS
  // -----------------------------------------

  function getMissingTranslations() {
    return [...missing].sort();
  }

  // -----------------------------------------
  // CLEANUP
  // -----------------------------------------

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

    index.clear();
    contentIndex.clear();
    missing.clear();
  }

  return {
    start,
    refresh,
    getMissingTranslations,
    destroy
  };
}
