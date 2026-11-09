
/**
 * LexBridge — Application Shell
 * Version: 0.1.0
 *
 * Creates an accessible sidebar and workspace.
 *
 * Does not load legal modules or generate workflows.
 * Existing application logic remains independent.
 */

"use strict";

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

function createNavButton({
  label,
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

  iconNode.setAttribute("aria-hidden", "true");

  const labelNode = el("span", label);

  button.append(iconNode, labelNode);

  if (disabled) {
    const note = el(
      "span",
      "Soon",
      "lb-nav-note"
    );
    button.appendChild(note);
  }

  return button;
}

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

  header.append(
    el("p", "WELCOME", "lb-eyebrow"),
    el(
      "h1",
      "Legal Workspace",
      "lb-page-title"
    ),
    el(
      "p",
      "Access your legal workflows and " +
      "prepare preliminary corporate documents.",
      "lb-page-description"
    )
  );

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

  corporateCard.append(
    el("h3", "Corporate Governance"),
    el(
      "p",
      "Prepare Swiss corporate registry " +
      "checklists and document drafts."
    )
  );

  const openButton = el(
    "button",
    "Open Corporate Workspace",
    "btn btn-primary"
  );

  openButton.type = "button";

  openButton.addEventListener("click", () => {
    onNavigate("corporate");
  });

  corporateCard.appendChild(openButton);

  const noticeCard = el(
    "article",
    null,
    "lb-dashboard-card"
  );

  noticeCard.append(
    el("h3", "More modules"),
    el(
      "p",
      "Contracts and Compliance are planned " +
      "for future releases."
    )
  );

  grid.append(corporateCard, noticeCard);

  const disclaimer = el(
    "p",
    "LexBridge is a preliminary legal workflow " +
    "support tool. Its output requires human review.",
    "lb-help-text"
  );

  disclaimer.style.marginTop = "24px";

  dashboard.append(header, grid, disclaimer);

  return dashboard;
}

/**
 * Create the main application workspace.
 *
 * @param {HTMLElement} host Root container.
 *
 * @returns {Object}
 *  - moduleContainer: mount existing modules here
 *  - navigate(page): change active page
 *  - showCorporate(): display corporate workspace
 *  - destroy(): remove shell
 */
export function createAppShell(host) {
  if (!(host instanceof HTMLElement)) {
    throw new Error(
      "A valid application host element is required."
    );
  }

  const shell = el("div", null, "lb-shell");

  // -------------------------------------
  // SIDEBAR
  // -------------------------------------

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

  brand.append(
    el("h2", "LexBridge", "lb-brand-name"),
    el(
      "p",
      "Swiss Legal Workspace",
      "lb-brand-caption"
    )
  );

  const navigation = el(
    "nav",
    null,
    "lb-nav"
  );

  navigation.setAttribute(
    "aria-label",
    "Main navigation"
  );

  const dashboardButton = createNavButton({
    label: "Dashboard",
    icon: "▦",
    page: "dashboard"
  });

  const corporateButton = createNavButton({
    label: "Corporate",
    icon: "▤",
    page: "corporate"
  });

  const contractsButton = createNavButton({
    label: "Contracts",
    icon: "▣",
    page: "contracts",
    disabled: true
  });

  const complianceButton = createNavButton({
    label: "Compliance",
    icon: "◈",
    page: "compliance",
    disabled: true
  });

  navigation.append(
    el("p", "WORKSPACE", "lb-nav-label"),
    dashboardButton,
    corporateButton,
    el("p", "FUTURE MODULES", "lb-nav-label"),
    contractsButton,
    complianceButton
  );

  const footer = el(
    "div",
    "Prototype · Human review required",
    "lb-sidebar-footer"
  );

  sidebar.append(brand, navigation, footer);

  // -------------------------------------
  // MAIN CONTENT
  // -------------------------------------

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

  // -------------------------------------
  // CORPORATE PAGE
  // -------------------------------------

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

  corporateHeader.append(
    el(
      "p",
      "SWISS LAW / CORPORATE",
      "lb-eyebrow"
    ),
    el(
      "h1",
      "Corporate Governance",
      "lb-page-title"
    ),
    el(
      "p",
      "Prepare a corporate registry workflow, " +
      "review legal steps and generate document drafts.",
      "lb-page-description"
    )
  );

  // Existing module loader mounts inside this node.
  const moduleContainer = el(
    "div",
    null,
    "lb-module-container"
  );

  corporatePage.append(
    corporateHeader,
    moduleContainer
  );

  // -------------------------------------
  // NAVIGATION
  // -------------------------------------

  const buttons = [
    dashboardButton,
    corporateButton
  ];

  let activePage = "";

  function navigate(page) {
    if (
      page !== "dashboard" &&
      page !== "corporate"
    ) {
      return;
    }

    activePage = page;

    dashboard.hidden = page !== "dashboard";
    corporatePage.hidden = page !== "corporate";

    for (const button of buttons) {
      const selected =
        button.dataset.page === activePage;

      button.classList.toggle(
        "is-active",
        selected
      );

      if (selected) {
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
  }

  const dashboard = createDashboard(navigate);

  dashboardButton.addEventListener(
    "click",
    () => navigate("dashboard")
  );

  corporateButton.addEventListener(
    "click",
    () => navigate("corporate")
  );

  content.append(dashboard, corporatePage);
  main.appendChild(content);

  shell.append(sidebar, main);

  // -------------------------------------
  // MOUNT
  // -------------------------------------

  host.replaceChildren(shell);

  navigate("dashboard");

  return {
    moduleContainer,

    navigate,

    showCorporate() {
      navigate("corporate");
    },

    getActivePage() {
      return activePage;
    },

    destroy() {
      shell.remove();
    }
  };
}
