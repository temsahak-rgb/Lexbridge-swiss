
/**
 * LexBridge — Language Switcher
 * Version: 0.1.0
 *
 * Accessible interface language selector.
 *
 * Supports English, French and German.
 * Does not change the document language.
 *
 * No external dependencies.
 */

"use strict";

import {
  SUPPORTED_LANGUAGES,
  getLanguage,
  setLanguage,
  onLanguageChange,
  t
} from "./i18n.js";

// ---------------------------------------------
// DOM HELPERS
// ---------------------------------------------

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

// ---------------------------------------------
// LANGUAGE SWITCHER
// ---------------------------------------------

/**
 * Create a reusable interface language selector.
 *
 * @param {Object} options
 * @param {Function} options.onError
 *
 * @returns {Object}
 *  - element: HTMLElement
 *  - refresh(): update current labels
 *  - destroy(): unsubscribe from i18n updates
 */
export function createLanguageSwitcher({
  onError = console.error
} = {}) {
  const root = el(
    "section",
    null,
    "lb-language-switcher"
  );

  root.setAttribute(
    "aria-label",
    "Interface language"
  );

  root.style.padding = "14px 10px";
  root.style.borderTop =
    "1px solid var(--lb-border, #dce3ea)";

  const label = el(
    "p",
    "",
    "lb-help-text"
  );

  label.style.margin = "0 0 10px";
  label.style.fontWeight = "650";

  const buttons = new Map();

  const controls = el(
    "div",
    null,
    "lb-language-options"
  );

  controls.style.display = "flex";
  controls.style.flexWrap = "wrap";
  controls.style.gap = "6px";

  const OPTIONS = [
    { code: "en", short: "EN" },
    { code: "fr", short: "FR" },
    { code: "de", short: "DE" }
  ];

  let busy = false;

  function refresh() {
    const active = getLanguage();

    label.textContent =
      t("language.interfaceLanguage");

    root.setAttribute(
      "aria-label",
      t("language.interfaceLanguage")
    );

    for (const language of OPTIONS) {
      const button = buttons.get(
        language.code
      );

      const selected =
        active === language.code;

      button.classList.toggle(
        "is-active",
        selected
      );

      button.setAttribute(
        "aria-pressed",
        String(selected)
      );

      button.disabled = busy;

      button.title =
        SUPPORTED_LANGUAGES.find(
          (entry) => entry.code === language.code
        )?.name || language.code;
    }
  }

  async function changeLanguage(code) {
    if (busy || code === getLanguage()) {
      return;
    }

    busy = true;
    refresh();

    try {
      await setLanguage(code);

    } catch (error) {
      onError(
        error,
        "Interface language change"
      );

    } finally {
      busy = false;
      refresh();
    }
  }

  for (const language of OPTIONS) {
    const button = el(
      "button",
      language.short,
      "lb-step lb-language-button"
    );

    button.type = "button";

    button.style.minWidth = "44px";
    button.style.minHeight = "44px";
    button.style.padding = "8px 10px";
    button.style.flex = "1 1 44px";

    button.dataset.language =
      language.code;

    button.addEventListener(
      "click",
      () => changeLanguage(language.code)
    );

    buttons.set(language.code, button);
    controls.appendChild(button);
  }

  root.append(label, controls);

  const unsubscribe =
    onLanguageChange(refresh);

  refresh();

  return {
    element: root,
    refresh,

    destroy() {
      unsubscribe();
      root.remove();
    }
  };
}
