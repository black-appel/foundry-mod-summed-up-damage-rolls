import {
  distributeSum,
  FULFILLMENT_METHOD,
  getSumSupport,
  isValidSum,
  MODULE_ID
} from "./rules.mjs";

const SUMMED_RESULT_OPTION = "summedUpManualResult";
const TEMPLATE_PATH = `modules/${MODULE_ID}/templates/roll-resolver.hbs`;

function localize(key, data = {}) {
  return game.i18n.format(`${MODULE_ID}.${key}`, data);
}

function clampResult(value, term) {
  return Math.min(Math.max(Math.round(value), term.minResult), term.maxResult);
}

function getSupport(term) {
  return getSumSupport({
    number: term.number,
    minResult: term.minResult,
    maxResult: term.maxResult,
    modifiers: term.modifiers,
    results: term.results
  });
}

/**
 * Build the custom resolver at Foundry's init hook, after the core resolver
 * class is available on the public foundry namespace.
 */
export function createSummedRollResolver() {
  const BaseRollResolver = foundry.applications.dice.RollResolver;

  class SummedRollResolver extends BaseRollResolver {
    #summedTerms = new Map();

    /** Retain Foundry's manual-roll permission when using our custom method. */
    async awaitFulfillment() {
      if (!game.user.hasPermission("MANUAL_ROLLS")) return;
      return super.awaitFulfillment();
    }

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      context.sumUp = {
        toggle: localize("resolver.toggle"),
        toggleHint: localize("resolver.toggleHint"),
        available: false,
        active: false
      };

      for (const [id, group] of Object.entries(context.groups)) {
        const descriptor = this.fulfillable.get(id);
        const term = descriptor.term;
        const usesSummedMethod = descriptor.method === FULFILLMENT_METHOD;
        const support = usesSummedMethod ? getSupport(term) : { supported: false, reason: "method" };
        group.sum = {
          ...support,
          label: support.supported ? localize("resolver.sumLabel", support) : "",
          info: support.supported ? localize("resolver.sumInfo") : "",
          specialRuleWarning: support.hasReroll ? localize("resolver.rerollWarning") : "",
          unsupported: support.supported
            ? ""
            : localize(usesSummedMethod ? "resolver.unsupported" : "resolver.manualInput")
        };
        context.sumUp.available ||= support.supported;
        context.sumUp.active ||= support.supported;

        // A custom interactive source must be editable just like Foundry's
        // built-in manual source; the base context marks other methods readonly.
        if (descriptor.method === FULFILLMENT_METHOD) {
          for (const result of group.results) result.readonly = false;
        }
      }
      return context;
    }

    async _onRender(context, options) {
      await super._onRender(context, options);
      const toggle = this.element.querySelector("[data-sum-up-toggle]");
      if (!toggle) return;

      const synchronize = ({ focus = false } = {}) => {
        const active = toggle.getAttribute("aria-checked") === "true";
        let firstSumInput;
        this.element.classList.toggle("sum-up-active", active);
        for (const group of this.element.querySelectorAll("[data-term-id]")) {
          const supported = group.dataset.sumSupported === "true";
          const sumInput = group.querySelector("[data-sum-input]");
          const individualInputs = group.querySelectorAll(".individual-results input");

          for (const input of individualInputs) {
            input.dataset.originalDisabled ??= String(input.disabled);
            input.disabled = (active && supported) || (input.dataset.originalDisabled === "true");
          }
          if (sumInput) {
            sumInput.disabled = !(active && supported);
            sumInput.required = active && supported;
            if (active && supported) firstSumInput ??= sumInput;
          }
        }

        if (focus && firstSumInput) {
          requestAnimationFrame(() => firstSumInput.focus({ preventScroll: true }));
        }
      };

      toggle.addEventListener("click", () => {
        const active = toggle.getAttribute("aria-checked") === "true";
        toggle.setAttribute("aria-checked", String(!active));
        synchronize({ focus: !active });
      });
      synchronize({ focus: true });
    }

    /**
     * Apply one submitted pool sum. Modifiers are restored after evaluation so
     * the formula remains truthful, but they are not applied a second time.
     */
    applySummedResult(term, sum) {
      const support = getSupport(term);
      if (!isValidSum(sum, support)) throw new RangeError("Manual sum is outside the supported range.");

      this.#summedTerms.set(term, {
        modifiers: [...term.modifiers],
        getTooltipData: term.getTooltipData
      });
      term.modifiers = [];
      term.options[SUMMED_RESULT_OPTION] = sum;
      term.results = distributeSum(sum, term).map(result => ({ result, active: true }));
    }

    #restoreSummedTerms() {
      for (const [term, state] of this.#summedTerms) {
        term.modifiers = state.modifiers;
        term.getTooltipData = function summedTooltipData() {
          const data = state.getTooltipData.call(this);
          const total = this.options[SUMMED_RESULT_OPTION];
          return {
            ...data,
            total,
            rolls: [{
              result: localize("resolver.manualSum", { total }),
              classes: "summed-up-result"
            }]
          };
        };
      }
      this.#summedTerms.clear();
    }

    async close(options = {}) {
      // Roll#_evaluate calls close immediately after all terms have evaluated.
      // Restore here before chat rendering reconstructs the displayed formula.
      this.#restoreSummedTerms();
      return super.close(options);
    }

    /**
     * Fulfil both the original per-die controls and our one-input-per-pool
     * controls. This mirrors Foundry's resolver while retaining the base class
     * form lifecycle and its private completion promise.
     */
    static async _fulfillRoll(event, form, _formData) {
      for (const [id, { term }] of this.fulfillable) {
        if (!event) {
          for (let index = term.results.length; index < Math.abs(term.number); index += 1) {
            term.results.push({ result: term.randomFace(), active: true });
          }
          continue;
        }

        const inputs = Array.from(form.querySelectorAll("input"))
          .filter(input => input.name === id && !input.disabled);
        const sumInput = inputs.find(input => input.dataset.sumInput === id);
        if (sumInput) {
          this.applySummedResult(term, sumInput.valueAsNumber);
          continue;
        }

        for (const input of inputs) {
          const value = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : term.randomFace();
          term.results.push({ result: clampResult(value, term), active: true });
        }
      }
    }
  }

  SummedRollResolver.DEFAULT_OPTIONS = foundry.utils.mergeObject(
    foundry.utils.deepClone(BaseRollResolver.DEFAULT_OPTIONS),
    {
      id: "summed-up-roll-resolver-{id}",
      classes: [...BaseRollResolver.DEFAULT_OPTIONS.classes, "summed-up-roll-resolver"],
      form: {
        ...BaseRollResolver.DEFAULT_OPTIONS.form,
        handler: SummedRollResolver._fulfillRoll
      }
    },
    { inplace: true }
  );
  SummedRollResolver.PARTS = {
    ...BaseRollResolver.PARTS,
    form: { id: "form", template: TEMPLATE_PATH }
  };

  return SummedRollResolver;
}
