
/**
 * LexBridge — Checklist Pagination
 * Version: 0.1.0
 *
 * Displays workflow checklist steps in small groups.
 *
 * Default: 5 steps per page.
 * Reuses the existing checklist renderer.
 *
 * Does not modify legal rules or workflow data.
 */

"use strict";

import {
  renderChecklist
} from "./checklist.js";

const DEFAULT_PAGE_SIZE = 5;

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

/**
 * Create a paginated workflow checklist.
 *
 * @param {Object} options
 * @param {Object} options.workflow
 * @param {Function} options.onChange
 * @param {number} options.pageSize
 *
 * @returns {Object}
 */
export function createChecklistPagination({
  workflow,
  onChange,
  pageSize = DEFAULT_PAGE_SIZE
}) {
  if (
    !workflow ||
    !Array.isArray(workflow.steps)
  ) {
    throw new Error(
      "Checklist pagination requires a valid workflow."
    );
  }

  if (typeof onChange !== "function") {
    throw new Error(
      "Checklist pagination requires onChange."
    );
  }

  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1
  ) {
    throw new Error(
      "Checklist page size must be a positive integer."
    );
  }

  let currentPage = 0;

  const root = el(
    "section",
    null,
    "lb-checklist-pagination"
  );

  const navigation = el("div");
  navigation.style.display = "flex";
  navigation.style.alignItems = "center";
  navigation.style.justifyContent = "space-between";
  navigation.style.gap = "12px";
  navigation.style.flexWrap = "wrap";
  navigation.style.marginTop = "18px";

  const previousButton = el(
    "button",
    "← Previous",
    "btn btn-secondary"
  );

  previousButton.type = "button";

  const nextButton = el(
    "button",
    "Next →",
    "btn btn-primary"
  );

  nextButton.type = "button";

  const counter = el(
    "span",
    "",
    "lb-help-text"
  );

  const checklistContent = el("div");

  navigation.append(
    previousButton,
    counter,
    nextButton
  );

  root.append(
    checklistContent,
    navigation
  );

  function getPageCount() {
    return Math.max(
      1,
      Math.ceil(workflow.steps.length / pageSize)
    );
  }

  function render() {
    const pageCount = getPageCount();

    currentPage = Math.min(
      currentPage,
      pageCount - 1
    );

    const start = currentPage * pageSize;
    const end = Math.min(
      start + pageSize,
      workflow.steps.length
    );

    // The original workflow stays intact.
    // Only the visible subset is passed to
    // the checklist renderer.
    const visibleWorkflow = {
      ...workflow,
      steps: workflow.steps.slice(start, end)
    };

    const checklist = renderChecklist(
      visibleWorkflow,
      (stepId, status) => {
        onChange(stepId, status);
      }
    );

    checklistContent.replaceChildren(
      checklist
    );

    counter.textContent =
      workflow.steps.length === 0
        ? "No checklist items"
        : `${start + 1}–${end} of ${workflow.steps.length} ` +
          `· Group ${currentPage + 1} of ${pageCount}`;

    previousButton.disabled =
      currentPage === 0;

    nextButton.disabled =
      currentPage >= pageCount - 1;
  }

  previousButton.addEventListener(
    "click",
    () => {
      if (currentPage > 0) {
        currentPage--;
        render();
      }
    }
  );

  nextButton.addEventListener(
    "click",
    () => {
      if (currentPage < getPageCount() - 1) {
        currentPage++;
        render();
      }
    }
  );

  render();

  return {
    element: root,

    getCurrentPage() {
      return currentPage;
    },

    goToPage(page) {
      if (
        !Number.isInteger(page) ||
        page < 0 ||
        page >= getPageCount()
      ) {
        return false;
      }

      currentPage = page;
      render();
      return true;
    },

    /**
     * Update the workflow after step status changes.
     * Keep the currently visible checklist group.
     */
    updateWorkflow(nextWorkflow) {
      if (
        !nextWorkflow ||
        !Array.isArray(nextWorkflow.steps)
      ) {
        throw new Error(
          "Invalid updated workflow."
        );
      }

      workflow = nextWorkflow;
      render();
    }
  };
}
