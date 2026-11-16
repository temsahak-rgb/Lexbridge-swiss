
/**
 * LexBridge — Internationalization Engine
 * Version: 0.1.1 — additive legal translation API
 *
 * Interface languages: English, French, German.
 *
 * - Loads local translation JSON files
 * - Supports nested translation keys
 * - Supports variable interpolation
 * - Notifies UI components about language changes
 * - Remembers selected interface language
 * - Falls back to English
 *
 * Document language remains independent.
 */

"use strict";

export const SUPPORTED_LANGUAGES = Object.freeze([
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" }
]);

export const DEFAULT_LANGUAGE = "en";

const STORAGE_KEY = "lexbridge.interfaceLanguage";

const dictionaries = new Map();
const listeners = new Set();

let legalContent = null;
let legalContentPromise = null;

let currentLanguage = DEFAULT_LANGUAGE;

function isSupported(code) {
  return SUPPORTED_LANGUAGES.some(
    (language) => language.code === code
  );
}

function normalizeLanguage(value) {
  const code = String(value || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];

  return isSupported(code)
    ? code
    : DEFAULT_LANGUAGE;
}

function readSavedLanguage() {
  try {
    return window.localStorage.getItem(
      STORAGE_KEY
    );
  } catch {
    return null;
  }
}

function saveLanguage(code) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      code
    );
  } catch {
    // The app still works when storage is disabled.
  }
}

function getNestedValue(dictionary, key) {
  const parts = key.split(".");
  let current = dictionary;

  for (const part of parts) {
    if (
      part === "__proto__" ||
      part === "constructor"
    ) {
      return undefined;
    }

    if (
      current === null ||
      typeof current !== "object" ||
      !Object.hasOwn(current, part)
    ) {
      return undefined;
    }

    current = current[part];
  }

  return typeof current === "string"
    ? current
    : undefined;
}

function interpolate(text, variables = {}) {
  return text.replace(
    /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g,
    (match, key) => {
      if (
        Object.hasOwn(variables, key) &&
        variables[key] !== null &&
        variables[key] !== undefined
      ) {
        return String(variables[key]);
      }

      return match;
    }
  );
}

/**
 * Load a translation dictionary.
 *
 * Paths are resolved relative to this module,
 * so GitHub Pages subdirectory hosting works.
 */
export async function loadLanguage(code) {
  const language = normalizeLanguage(code);

  if (dictionaries.has(language)) {
    return dictionaries.get(language);
  }

  const url = new URL(
    `../../locales/${language}.json`,
    import.meta.url
  );

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to load ${language} translations ` +
      `(HTTP ${response.status}).`
    );
  }

  const dictionary = await response.json();

  if (
    !dictionary ||
    typeof dictionary !== "object" ||
    Array.isArray(dictionary)
  ) {
    throw new Error(
      `Invalid translation dictionary: ${language}`
    );
  }

  dictionaries.set(language, dictionary);

  return dictionary;
}

/**
 * Load the independent legal-display dictionary once.
 * This function does not change workflow data or interface language.
 * A failed request is retryable.
 */
export async function loadLegalContent() {
  if (legalContent) return legalContent;
  if (legalContentPromise) return legalContentPromise;

  legalContentPromise = (async () => {
    const url = new URL(
      "../../locales/legal-content.json",
      import.meta.url
    );

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Unable to load legal content (HTTP ${response.status}).`
      );
    }

    const data = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      !data.corporate
    ) {
      throw new Error(
        "Invalid legal-content.json structure."
      );
    }

    legalContent = data;
    return data;
  })();

  try {
    return await legalContentPromise;
  } finally {
    legalContentPromise = null;
  }
}

/**
 * Translate a stable legal-content key without mutating legal data.
 *
 * Example:
 * tLegal(
 *   "corporate.workflowSteps.verifyCompanyRegistration.title"
 * )
 *
 * If no entry is available, uses an explicitly
 * supplied fallback (or the key).
 */
export function tLegal(
  key,
  variables = {},
  fallbackText = ""
) {
  if (
    typeof key !== "string" ||
    !key.trim()
  ) {
    return String(fallbackText ?? "");
  }

  const parts = key.split(".");
  let entry = legalContent;

  for (const part of parts) {
    if (
      !part ||
      part === "__proto__" ||
      part === "constructor" ||
      !entry ||
      typeof entry !== "object" ||
      !Object.hasOwn(entry, part)
    ) {
      entry = null;
      break;
    }

    entry = entry[part];
  }

  if (
    !entry ||
    typeof entry !== "object" ||
    Array.isArray(entry)
  ) {
    return interpolate(
      String(fallbackText || key),
      variables
    );
  }

  const translated =
    (
      typeof entry[currentLanguage] === "string" &&
      entry[currentLanguage]
    ) ||
    (
      typeof entry.en === "string" &&
      entry.en
    ) ||
    String(fallbackText || key);

  return interpolate(
    translated,
    variables
  );
}

/**
 * Initialize the interface language.
 *
 * English is the fallback language.
 * Missing translation files are handled safely.
 */
export async function initializeI18n() {
  const saved = readSavedLanguage();

  const browserLanguage =
    typeof navigator !== "undefined"
      ? navigator.language
      : DEFAULT_LANGUAGE;

  const preferred = normalizeLanguage(
    saved || browserLanguage
  );

  try {
    await loadLanguage(DEFAULT_LANGUAGE);

    if (preferred !== DEFAULT_LANGUAGE) {
      await loadLanguage(preferred);
    }

    currentLanguage = preferred;
  } catch (error) {
    console.warn(
      "[LexBridge i18n] Language loading failed:",
      error
    );

    currentLanguage = DEFAULT_LANGUAGE;
  }

  document.documentElement.lang =
    currentLanguage;

  notifyListeners();

  return currentLanguage;
}

/**
 * Translate a key.
 *
 * Example:
 * t("navigation.dashboard")
 *
 * With variables:
 * t("workflow.progress", {
 *   completed: 3,
 *   total: 10
 * })
 */
export function t(key, variables = {}) {
  if (
    typeof key !== "string" ||
    !key.trim()
  ) {
    return "";
  }

  const activeDictionary =
    dictionaries.get(currentLanguage) || {};

  const englishDictionary =
    dictionaries.get(DEFAULT_LANGUAGE) || {};

  const translation =
    getNestedValue(activeDictionary, key) ??
    getNestedValue(englishDictionary, key) ??
    key;

  return interpolate(
    translation,
    variables
  );
}

/**
 * Change the interface language.
 *
 * Returns true on success.
 * Leaves the previous language intact on failure.
 */
export async function setLanguage(code) {
  const language = normalizeLanguage(code);

  // Reject unsupported values explicitly.
  if (
    !isSupported(
      String(code || "").toLowerCase()
    )
  ) {
    throw new Error(
      "Unsupported interface language: " + code
    );
  }

  await loadLanguage(DEFAULT_LANGUAGE);

  if (language !== DEFAULT_LANGUAGE) {
    await loadLanguage(language);
  }

  currentLanguage = language;

  saveLanguage(language);

  document.documentElement.lang = language;

  notifyListeners();

  return true;
}

export function getLanguage() {
  return currentLanguage;
}

/**
 * Subscribe to changes.
 *
 * Call the returned function to unsubscribe.
 */
export function onLanguageChange(callback) {
  if (typeof callback !== "function") {
    throw new Error(
      "Language listener must be a function."
    );
  }

  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener(currentLanguage);
    } catch (error) {
      console.error(
        "[LexBridge i18n] Listener failed:",
        error
      );
    }
  }
}

/**
 * Translate existing DOM elements with data-i18n.
 *
 * Example:
 * <span data-i18n="navigation.dashboard"></span>
 *
 * Optional attributes:
 * data-i18n-placeholder
 * data-i18n-title
 *
 * Uses textContent, never innerHTML.
 */
export function translateDOM(root = document) {
  const elements = [];

  if (
    root instanceof Element &&
    root.hasAttribute("data-i18n")
  ) {
    elements.push(root);
  }

  elements.push(
    ...root.querySelectorAll("[data-i18n]")
  );

  for (const element of elements) {
    const key = element.dataset.i18n;

    if (key) {
      element.textContent = t(key);
    }

    const placeholderKey =
      element.dataset.i18nPlaceholder;

    if (placeholderKey) {
      element.setAttribute(
        "placeholder",
        t(placeholderKey)
      );
    }

    const titleKey =
      element.dataset.i18nTitle;

    if (titleKey) {
      element.setAttribute(
        "title",
        t(titleKey)
      );
    }
  }
}
