export const MODULE_ID = "summed-up-damage-rolls";
export const FULFILLMENT_METHOD = "summed-manual";

const REROLL_MODIFIER = /^rr?(?:\d+)?(?:[<>=]+)?(?:\d+)?$/i;

/**
 * Determine whether a dice term can be represented faithfully by one finite
 * integer sum. Rerolls are allowed because the entered value is the already
 * resolved physical result and Foundry will not apply the modifier again.
 */
export function getSumSupport({ number, minResult, maxResult, modifiers = [], results = [] }) {
  if (!Number.isInteger(number) || number <= 0) return { supported: false, reason: "number" };
  if (!Number.isInteger(minResult) || !Number.isInteger(maxResult) || minResult > maxResult) {
    return { supported: false, reason: "range" };
  }
  if (results.length) return { supported: false, reason: "resolved" };

  const unsupportedModifier = modifiers.find(modifier => !REROLL_MODIFIER.test(modifier));
  if (unsupportedModifier) return { supported: false, reason: "modifier", modifier: unsupportedModifier };

  return {
    supported: true,
    min: number * minResult,
    max: number * maxResult,
    hasReroll: modifiers.length > 0
  };
}

/** Return true only for an integer inside a supported term's total range. */
export function isValidSum(value, support) {
  return support.supported
    && Number.isInteger(value)
    && value >= support.min
    && value <= support.max;
}

/**
 * Turn a valid sum into a legal sequence of die faces. The sequence is an
 * internal representation only; the chat tooltip is labelled as a manual sum.
 */
export function distributeSum(value, { number, minResult, maxResult }) {
  const support = getSumSupport({ number, minResult, maxResult });
  if (!isValidSum(value, support)) throw new RangeError("The manual sum is outside the possible dice range.");

  const values = Array(number).fill(minResult);
  let remainder = value - support.min;
  const capacity = maxResult - minResult;
  for (let index = 0; index < values.length; index += 1) {
    const increase = Math.min(remainder, capacity);
    values[index] += increase;
    remainder -= increase;
  }
  return values;
}
