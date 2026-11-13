import { FULFILLMENT_METHOD, MODULE_ID } from "./rules.mjs";
import { createSummedRollResolver } from "./summed-roll-resolver.mjs";

Hooks.once("init", () => {
  const methods = CONFIG.Dice.fulfillment.methods;
  if (methods[FULFILLMENT_METHOD]) {
    console.warn(`${MODULE_ID} | The ${FULFILLMENT_METHOD} fulfillment method is already registered.`);
    return;
  }

  methods[FULFILLMENT_METHOD] = {
    label: `${MODULE_ID}.fulfillment.label`,
    icon: '<i class="fa-solid fa-calculator"></i>',
    interactive: true,
    resolver: createSummedRollResolver()
  };
});
