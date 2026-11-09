
/**
 * LexBridge — Application Shell
 * Version: 0.2.0
 *
 * Features:
 * - Consistent left sidebar
 * - Dashboard and Corporate workspace
 * - English, French and German interface
 * - Language selector in the sidebar
 * - Preserves existing module state
 * - Accessible navigation
 *
 * Framework-free ES module.
 * Compatible with GitHub Pages.
 */

"use strict";

import {
  initializeI18n,
  onLanguageChange,
  t
} from "./i18n.js";

import {
  createLanguageSwitcher
} from "./language-switcher.js";

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
    t(translationKey)
  );

  const note = disabled
    ? el(
        "span",
        t("navigation.comingSoon"),
        "lb-nav-note"
      )
    : null;

  button.append(iconNode, labelNode);

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

  // Dashboard cards

  const grid = el(
    "div",
    null,
    "lb-dashboard-grid"
  );

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

  // Disclaimer

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
// APPLICATION SHELL
// ---------------------------------------------

/**
 * Create the LexBridge workspace.
 *
 * @param {HTMLElement} host
 *
 * Returns:
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
  // ROOT SHELL
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

  navigation.setAttribute(
    "aria-label",
    "Main navigation"
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
  // LANGUAGE SELECTOR
  // -------------------------------------------

  const languageSwitcher =
    createLanguageSwitcher({
      onError(error, context) {
        reportShellError(error, context);
      }
    });

  const sidebarFooter = el(
    "div",
    "",
    "lb-sidebar-footer"
  );

  // Keep language selection near the
  // bottom of the sidebar.
  languageSwitcher.element.style.marginTop =
    "auto";

  sidebar.append(
    brand,
    navigation,
    languageSwitcher.element,
    sidebarFooter
  );

  // -------------------------------------------
  // MAIN WORKSPACE
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

  // Existing legal modules are mounted here.
  // Never recreate this element when
  // changing interface language.
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

  const activeButtons = [
    dashboardNav.element,
    corporateNav.element
  ];

  let activePage = "dashboard";

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
  // UPDATE ALL SHELL TRANSLATIONS
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

    languageSwitcher.refresh();
  }

  // -------------------------------------------
  // LANGUAGE CHANGE SUBSCRIPTION
  // -------------------------------------------

  const unsubscribe =
    onLanguageChange(updateTranslations);

  // -------------------------------------------
  // INITIAL MOUNT
  // -------------------------------------------

  host.replaceChildren(shell);

  navigate("dashboard");
  updateTranslations();

  // Load the saved or browser language.
  // Keep the shell synchronous for compatibility
  // with the existing js/app.js bootstrap.
  initializeI18n().catch((error) => {
    reportShellError(
      error,
      "Language initialization"
    );
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

      unsubscribe();
      languageSwitcher.destroy();

      shell.remove();
    }
  };
}
