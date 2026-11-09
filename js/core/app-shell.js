
/**
 * LexBridge — Application Shell
 * Version: 0.3.0
 *
 * Features:
 * - Permanent left sidebar on all devices
 * - Dashboard and Corporate workspace
 * - Language selector at the top right
 * - English, French and German interface
 * - Preserves mounted corporate module state
 * - Accessible navigation and language control
 *
 * Framework-free ES module.
 * Compatible with GitHub Pages.
 */

"use strict";

import {
  initializeI18n,
  getLanguage,
  setLanguage,
  onLanguageChange,
  t
} from "./i18n.js";

// ---------------------------------------------
// DOM UTILITIES
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
// ERROR REPORTING
// ---------------------------------------------

function reportShellError(error, context) {
  console.error(
    "[LexBridge: " + context + "]",
    error
  );

  if (
    typeof window.LexBridgeReportError ===
    "function"
  ) {
    window.LexBridgeReportError(
      context + ": " +
      (error instanceof Error
        ? error.message
        : String(error))
    );
  }
}

// ---------------------------------------------
// SIDEBAR NAVIGATION BUTTON
// ---------------------------------------------

function createNavButton({
  translationKey,
  icon,
  page,
  disabled = false
}) {
  const button = el(
    "button",
    null,
    "lb-nav-item"
  );

  button.type = "button";
  button.dataset.page = page;
  button.disabled = disabled;

  const iconNode = el(
    "span",
    icon,
    "lb-nav-icon"
  );

  iconNode.setAttribute(
    "aria-hidden",
    "true"
  );

  const labelNode = el(
    "span",
    ""
  );

  const note = disabled
    ? el(
        "span",
        "",
        "lb-nav-note"
      )
    : null;

  button.append(
    iconNode,
    labelNode
  );

  if (note) {
    button.appendChild(note);
  }

  function updateTranslation() {
    const label = t(translationKey);

    labelNode.textContent = label;

    button.setAttribute(
      "aria-label",
      label
    );

    if (note) {
      note.textContent =
        t("navigation.comingSoon");
    }
  }

  updateTranslation();

  return {
    element: button,
    updateTranslation
  };
}

// ---------------------------------------------
// DASHBOARD
// ---------------------------------------------

function createDashboard(onNavigate) {
  const dashboard = el(
    "section",
    null,
    "lb-dashboard"
  );

  const header = el(
    "header",
    null,
    "lb-page-header"
  );

  const eyebrow = el(
    "p",
    "",
    "lb-eyebrow"
  );

  const title = el(
    "h1",
    "",
    "lb-page-title"
  );

  const description = el(
    "p",
    "",
    "lb-page-description"
  );

  header.append(
    eyebrow,
    title,
    description
  );

  const grid = el(
    "div",
    null,
    "lb-dashboard-grid"
  );

  // Corporate card

  const corporateCard = el(
    "article",
    null,
    "lb-dashboard-card"
  );

  const corporateTitle = el("h3");
  const corporateDescription = el("p");

  const openButton = el(
    "button",
    "",
    "btn btn-primary"
  );

  openButton.type = "button";

  openButton.addEventListener(
    "click",
    () => onNavigate("corporate")
  );

  corporateCard.append(
    corporateTitle,
    corporateDescription,
    openButton
  );

  // Future modules card

  const futureCard = el(
    "article",
    null,
    "lb-dashboard-card"
  );

  const futureTitle = el("h3");
  const futureDescription = el("p");

  futureCard.append(
    futureTitle,
    futureDescription
  );

  grid.append(
    corporateCard,
    futureCard
  );

  const disclaimer = el(
    "p",
    "",
    "lb-help-text"
  );

  disclaimer.style.marginTop = "24px";

  dashboard.append(
    header,
    grid,
    disclaimer
  );

  function updateTranslations() {
    eyebrow.textContent =
      t("dashboard.eyebrow");

    title.textContent =
      t("dashboard.title");

    description.textContent =
      t("dashboard.description");

    corporateTitle.textContent =
      t("dashboard.corporateTitle");

    corporateDescription.textContent =
      t("dashboard.corporateDescription");

    openButton.textContent =
      t("dashboard.openCorporate");

    futureTitle.textContent =
      t("dashboard.moreModulesTitle");

    futureDescription.textContent =
      t("dashboard.moreModulesDescription");

    disclaimer.textContent =
      t("dashboard.disclaimer");
  }

  updateTranslations();

  return {
    element: dashboard,
    updateTranslations
  };
}

// ---------------------------------------------
// TOP-RIGHT LANGUAGE SELECTOR
// ---------------------------------------------

/**
 * Creates a compact, native language selector.
 *
 * The control is placed in the top-right area
 * of the main workspace, not in the sidebar.
 *
 * Native select works with mouse, keyboard,
 * touch screens, iPad and mobile browsers.
 *
 * Document language is not affected.
 */
function createTopLanguageSelector() {
  const wrapper = el(
    "div",
    null,
    "lb-top-language-selector"
  );

  wrapper.style.display = "inline-flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "flex-end";
  wrapper.style.gap = "8px";
  wrapper.style.maxWidth = "100%";

  const globe = el(
    "span",
    "🌐"
  );

  globe.setAttribute(
    "aria-hidden",
    "true"
  );

  globe.style.fontSize = "20px";
  globe.style.lineHeight = "1";

  const select = el(
    "select",
    null,
    "lb-language-select"
  );

  select.id = "lb-interface-language";
  select.name = "interfaceLanguage";

  select.style.width = "auto";
  select.style.minWidth = "76px";
  select.style.minHeight = "44px";
  select.style.padding = "8px 12px";

  select.style.border =
    "1px solid var(--lb-border, #dce3ea)";

  select.style.borderRadius = "9px";
  select.style.backgroundColor = "#ffffff";
  select.style.color =
    "var(--lb-navy, #172c45)";

  select.style.fontFamily = "inherit";
  select.style.fontSize = "14px";
  select.style.fontWeight = "700";
  select.style.cursor = "pointer";

  const languages = [
    {
      code: "en",
      label: "EN — English"
    },
    {
      code: "fr",
      label: "FR — Français"
    },
    {
      code: "de",
      label: "DE — Deutsch"
    }
  ];

  for (const language of languages) {
    const option = el(
      "option",
      language.label
    );

    option.value = language.code;

    select.appendChild(option);
  }

  const screenReaderLabel = el(
    "label",
    "",
    "lb-language-accessible-label"
  );

  screenReaderLabel.htmlFor = select.id;

  // Visually hidden but available to
  // screen readers and accessibility tools.
  screenReaderLabel.style.position = "absolute";
  screenReaderLabel.style.width = "1px";
  screenReaderLabel.style.height = "1px";
  screenReaderLabel.style.padding = "0";
  screenReaderLabel.style.margin = "-1px";
  screenReaderLabel.style.overflow = "hidden";
  screenReaderLabel.style.clip = "rect(0, 0, 0, 0)";
  screenReaderLabel.style.whiteSpace = "nowrap";
  screenReaderLabel.style.border = "0";

  wrapper.append(
    globe,
    screenReaderLabel,
    select
  );

  let busy = true;
  let destroyed = false;

  select.disabled = true;

  function refresh() {
    if (destroyed) return;

    const current = getLanguage();

    select.value = current;

    const accessibleName =
      t("language.interfaceLanguage");

    screenReaderLabel.textContent =
      accessibleName;

    select.title = accessibleName;
    select.setAttribute(
      "aria-label",
      accessibleName
    );

    select.disabled = busy;
  }

  async function handleChange() {
    if (busy || destroyed) return;

    const nextLanguage = select.value;
    const previousLanguage = getLanguage();

    if (nextLanguage === previousLanguage) {
      return;
    }

    busy = true;
    refresh();

    try {
      await setLanguage(nextLanguage);
    } catch (error) {
      reportShellError(
        error,
        "Interface language change"
      );

      // Restore the selected option if
      // the requested language failed to load.
      select.value = previousLanguage;
    } finally {
      busy = false;
      refresh();
    }
  }

  select.addEventListener(
    "change",
    handleChange
  );

  function setReady() {
    busy = false;
    refresh();
  }

  refresh();

  return {
    element: wrapper,
    refresh,
    setReady,

    destroy() {
      destroyed = true;

      select.removeEventListener(
        "change",
        handleChange
      );

      wrapper.remove();
    }
  };
}

// ---------------------------------------------
// APPLICATION SHELL
// ---------------------------------------------

/**
 * Create the LexBridge application shell.
 *
 * Public API:
 * - moduleContainer
 * - navigate(page)
 * - showCorporate()
 * - getActivePage()
 * - destroy()
 */
export function createAppShell(host) {
  if (!(host instanceof HTMLElement)) {
    throw new Error(
      "A valid application host is required."
    );
  }

  let destroyed = false;

  // -------------------------------------------
  // ROOT
  // -------------------------------------------

  const shell = el(
    "div",
    null,
    "lb-shell"
  );

  // -------------------------------------------
  // SIDEBAR
  // -------------------------------------------

  const sidebar = el(
    "aside",
    null,
    "lb-sidebar"
  );

  const brand = el(
    "div",
    null,
    "lb-brand"
  );

  const brandName = el(
    "h2",
    "LexBridge",
    "lb-brand-name"
  );

  const brandCaption = el(
    "p",
    "",
    "lb-brand-caption"
  );

  brand.append(
    brandName,
    brandCaption
  );

  // -------------------------------------------
  // NAVIGATION
  // -------------------------------------------

  const navigation = el(
    "nav",
    null,
    "lb-nav"
  );

  const workspaceLabel = el(
    "p",
    "",
    "lb-nav-label"
  );

  const futureLabel = el(
    "p",
    "",
    "lb-nav-label"
  );

  const dashboardNav = createNavButton({
    translationKey: "navigation.dashboard",
    icon: "▦",
    page: "dashboard"
  });

  const corporateNav = createNavButton({
    translationKey: "navigation.corporate",
    icon: "▤",
    page: "corporate"
  });

  const contractsNav = createNavButton({
    translationKey: "navigation.contracts",
    icon: "▣",
    page: "contracts",
    disabled: true
  });

  const complianceNav = createNavButton({
    translationKey: "navigation.compliance",
    icon: "◈",
    page: "compliance",
    disabled: true
  });

  navigation.append(
    workspaceLabel,
    dashboardNav.element,
    corporateNav.element,
    futureLabel,
    contractsNav.element,
    complianceNav.element
  );

  // -------------------------------------------
  // SIDEBAR FOOTER
  // -------------------------------------------

  const sidebarFooter = el(
    "div",
    "",
    "lb-sidebar-footer"
  );

  // No language selector in the sidebar.
  sidebar.append(
    brand,
    navigation,
    sidebarFooter
  );

  // -------------------------------------------
  // MAIN CONTENT
  // -------------------------------------------

  const main = el(
    "main",
    null,
    "lb-main"
  );

  main.id = "lb-main-content";

  const content = el(
    "div",
    null,
    "lb-content"
  );

  // -------------------------------------------
  // TOP BAR
  // -------------------------------------------

  const topBar = el(
    "div",
    null,
    "lb-topbar"
  );

  topBar.style.display = "flex";
  topBar.style.alignItems = "center";
  topBar.style.justifyContent = "flex-end";
  topBar.style.gap = "12px";

  topBar.style.width = "100%";
  topBar.style.minHeight = "48px";
  topBar.style.marginBottom = "24px";

  const languageSelector =
    createTopLanguageSelector();

  topBar.appendChild(
    languageSelector.element
  );

  // -------------------------------------------
  // CORPORATE PAGE
  // -------------------------------------------

  const corporatePage = el(
    "section",
    null,
    "lb-corporate-page"
  );

  const corporateHeader = el(
    "header",
    null,
    "lb-page-header"
  );

  const corporateEyebrow = el(
    "p",
    "",
    "lb-eyebrow"
  );

  const corporateTitle = el(
    "h1",
    "",
    "lb-page-title"
  );

  const corporateDescription = el(
    "p",
    "",
    "lb-page-description"
  );

  corporateHeader.append(
    corporateEyebrow,
    corporateTitle,
    corporateDescription
  );

  // Stable container:
  // Never replace it during language changes.
  const moduleContainer = el(
    "div",
    null,
    "lb-module-container"
  );

  corporatePage.append(
    corporateHeader,
    moduleContainer
  );

  // -------------------------------------------
  // DASHBOARD
  // -------------------------------------------

  const dashboard = createDashboard(navigate);

  content.append(
    topBar,
    dashboard.element,
    corporatePage
  );

  main.appendChild(content);

  shell.append(
    sidebar,
    main
  );

  // -------------------------------------------
  // PAGE NAVIGATION
  // -------------------------------------------

  let activePage = "dashboard";

  const activeButtons = [
    dashboardNav.element,
    corporateNav.element
  ];

  function navigate(page) {
    if (
      destroyed ||
      !["dashboard", "corporate"].includes(page)
    ) {
      return false;
    }

    activePage = page;

    dashboard.element.hidden =
      page !== "dashboard";

    corporatePage.hidden =
      page !== "corporate";

    for (const button of activeButtons) {
      const active =
        button.dataset.page === page;

      button.classList.toggle(
        "is-active",
        active
      );

      if (active) {
        button.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        button.removeAttribute(
          "aria-current"
        );
      }
    }

    return true;
  }

  dashboardNav.element.addEventListener(
    "click",
    () => navigate("dashboard")
  );

  corporateNav.element.addEventListener(
    "click",
    () => navigate("corporate")
  );

  // -------------------------------------------
  // TRANSLATIONS
  // -------------------------------------------

  function updateTranslations() {
    if (destroyed) return;

    brandCaption.textContent =
      t("app.tagline");

    workspaceLabel.textContent =
      t("navigation.workspace");

    futureLabel.textContent =
      t("navigation.futureModules");

    sidebarFooter.textContent =
      t("app.prototype") +
      " · " +
      t("app.humanReview");

    navigation.setAttribute(
      "aria-label",
      t("navigation.workspace")
    );

    dashboardNav.updateTranslation();
    corporateNav.updateTranslation();
    contractsNav.updateTranslation();
    complianceNav.updateTranslation();

    dashboard.updateTranslations();

    corporateEyebrow.textContent =
      t("corporate.eyebrow");

    corporateTitle.textContent =
      t("corporate.title");

    corporateDescription.textContent =
      t("corporate.description");

    languageSelector.refresh();
  }

  const unsubscribeLanguage =
    onLanguageChange(updateTranslations);

  // -------------------------------------------
  // INITIAL MOUNT
  // -------------------------------------------

  host.replaceChildren(shell);

  navigate("dashboard");
  updateTranslations();

  // Initialize asynchronously to preserve
  // compatibility with existing js/app.js.
  initializeI18n()
    .catch((error) => {
      reportShellError(
        error,
        "Language initialization"
      );
    })
    .finally(() => {
      if (destroyed) return;

      languageSelector.setReady();
      updateTranslations();
    });

  // -------------------------------------------
  // PUBLIC API
  // -------------------------------------------

  return {
    moduleContainer,

    navigate,

    showCorporate() {
      return navigate("corporate");
    },

    getActivePage() {
      return activePage;
    },

    destroy() {
      if (destroyed) return;

      destroyed = true;

      unsubscribeLanguage();
      languageSelector.destroy();

      shell.remove();
    }
  };
}
