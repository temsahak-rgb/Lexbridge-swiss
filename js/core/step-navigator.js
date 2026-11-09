
/**
 * LexBridge — Step Navigator
 * Version: 0.1.0
 *
 * Reusable navigation for multi-step forms.
 *
 * Features:
 * - Back / Continue navigation
 * - Progress indicator
 * - Input preservation
 * - Optional step validation
 * - Accessible labels
 *
 * No legal logic or external dependencies.
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

/**
 * Create a reusable step navigator.
 *
 * @param {Object} options
 * @param {Array} options.steps
 *   Each step: { id, title, content, validate? }
 * @param {Function} options.onComplete
 * @param {Function} options.onChange
 *
 * @returns {Object}
 */
export function createStepNavigator({
  steps,
  onComplete = () => {},
  onChange = () => {}
}) {
  if (
    !Array.isArray(steps) ||
    steps.length === 0
  ) {
    throw new Error(
      "Step Navigator requires at least one step."
    );
  }

  const ids = new Set();

  for (const step of steps) {
    if (
      !step ||
      typeof step.id !== "string" ||
      !step.id.trim() ||
      typeof step.title !== "string" ||
      !step.title.trim() ||
      !(step.content instanceof HTMLElement)
    ) {
      throw new Error(
        "Each step requires an ID, title and HTML element."
      );
    }

    if (ids.has(step.id)) {
      throw new Error(
        "Duplicate step ID: " + step.id
      );
    }

    ids.add(step.id);

    if (
      step.validate !== undefined &&
      typeof step.validate !== "function"
    ) {
      throw new Error(
        "Step validation must be a function."
      );
    }
  }

  if (
    typeof onComplete !== "function" ||
    typeof onChange !== "function"
  ) {
    throw new Error(
      "Invalid navigator callback."
    );
  }

  let currentIndex = 0;
  let busy = false;

  const root = el(
    "section",
    null,
    "lb-step-navigator"
  );

  // ----------------------------------------
  // HEADER
  // ----------------------------------------

  const header = el(
    "div",
    null,
    "lb-page-header"
  );

  const counter = el(
    "p",
    "",
    "lb-eyebrow"
  );

  const title = el(
    "h3",
    "",
    "lb-panel-title"
  );

  header.append(counter, title);

  // ----------------------------------------
  // PROGRESS INDICATOR
  // ----------------------------------------

  const progress = el(
    "progress"
  );

  progress.max = steps.length;
  progress.value = 1;
  progress.style.width = "100%";
  progress.style.height = "10px";
  progress.style.marginBottom = "24px";

  progress.setAttribute(
    "aria-label",
    "Step progress"
  );

  // ----------------------------------------
  // CONTENT AREA
  // ----------------------------------------

  const content = el(
    "div",
    null,
    "lb-step-navigator-content"
  );

  for (const step of steps) {
    step.content.hidden = true;
    content.appendChild(step.content);
  }

  // ----------------------------------------
  // ERROR MESSAGE
  // ----------------------------------------

  const errorMessage = el(
    "p",
    "",
    "lb-help-text"
  );

  errorMessage.hidden = true;
  errorMessage.setAttribute(
    "role",
    "alert"
  );

  // ----------------------------------------
  // NAVIGATION BUTTONS
  // ----------------------------------------

  const actions = el("div");

  actions.style.display = "flex";
  actions.style.justifyContent = "space-between";
  actions.style.gap = "12px";
  actions.style.flexWrap = "wrap";
  actions.style.marginTop = "24px";

  const backButton = el(
    "button",
    "Back",
    "btn btn-secondary"
  );

  backButton.type = "button";

  const nextButton = el(
    "button",
    "Continue",
    "btn btn-primary"
  );

  nextButton.type = "button";

  actions.append(
    backButton,
    nextButton
  );

  root.append(
    header,
    progress,
    content,
    errorMessage,
    actions
  );

  // ----------------------------------------
  // RENDER CURRENT STEP
  // ----------------------------------------

  function render() {
    const step = steps[currentIndex];

    counter.textContent =
      `Step ${currentIndex + 1} of ${steps.length}`;

    title.textContent = step.title;

    progress.value = currentIndex + 1;

    steps.forEach((item, index) => {
      item.content.hidden =
        index !== currentIndex;
    });

    backButton.disabled =
      busy || currentIndex === 0;

    nextButton.disabled = busy;

    nextButton.textContent = busy
      ? "Please wait..."
      : currentIndex === steps.length - 1
        ? "Finish"
        : "Continue";
  }

  // ----------------------------------------
  // SHOW ERROR
  // ----------------------------------------

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.color = "#a52727";
    errorMessage.hidden = false;
  }

  function clearError() {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
  }

  // ----------------------------------------
  // GO TO STEP
  // ----------------------------------------

  function goTo(index) {
    if (
      busy ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= steps.length
    ) {
      return false;
    }

    currentIndex = index;
    clearError();
    render();

    onChange({
      index: currentIndex,
      step: steps[currentIndex]
    });

    return true;
  }

  // ----------------------------------------
  // NEXT / COMPLETE
  // ----------------------------------------

  async function next() {
    if (busy) return;

    busy = true;
    clearError();
    render();

    try {
      const step = steps[currentIndex];

      if (step.validate) {
        const valid = await step.validate();

        if (!valid) {
          showError(
            "Please complete the required information " +
            "before continuing."
          );
          return;
        }
      }

      if (currentIndex === steps.length - 1) {
        await onComplete();
      } else {
        currentIndex += 1;

        onChange({
          index: currentIndex,
          step: steps[currentIndex]
        });
      }

    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );

    } finally {
      busy = false;
      render();
    }
  }

  // ----------------------------------------
  // EVENTS
  // ----------------------------------------

  backButton.addEventListener(
    "click",
    () => goTo(currentIndex - 1)
  );

  nextButton.addEventListener(
    "click",
    next
  );

  // Initial display
  render();

  return {
    element: root,

    next,

    back() {
      return goTo(currentIndex - 1);
    },

    goToStep(stepId) {
      const index = steps.findIndex(
        (step) => step.id === stepId
      );

      return goTo(index);
    },

    getCurrentStep() {
      return steps[currentIndex].id;
    },

    reset() {
      return goTo(0);
    }
  };
}
