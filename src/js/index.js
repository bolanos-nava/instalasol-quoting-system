"use strict";

import { getConstants } from "./modules/fetchers.js";

/**
 * Solar panel quoting system
 *
 * V0.1
 * See: quoting_system.md for more information
 */

function getTotalSystemCalculation(costAverageBimonthly) {
  const COST_PER_KW = 3; // cost per kiloWatt
  const PRODUCED_ENERGY_PER_KWP = 4; // produced energy per kiloWatt-peak
  const PANEL_POWER = 555; // power in kiloWatts per solar panel
  const PANEL_COST = 18000; // cost per panel

  const consumptionBimonthly = costAverageBimonthly / COST_PER_KW;
  const consumptionAverageDaily = consumptionBimonthly / 60;

  const kwpRequired = consumptionAverageDaily / PRODUCED_ENERGY_PER_KWP;

  // we round up the quantity of solar panels
  const panelsQuantity = parseInt((kwpRequired * 1000) / PANEL_POWER + 1.0);
  const panelsCost = panelsQuantity * PANEL_COST;
  const powerTotal = (panelsQuantity * PANEL_POWER) / 1000; // total power in kiloWatts

  return {
    panelsQuantity,
    panelsCost,
    powerTotal,
  };
}

function getPaymentOptionName(paymentOptionId) {
  // This format simulates what we would get from a database
  const paymentOptions = [
    {
      id: 1,
      name: "oneExhibition",
    },
    {
      id: 2,
      name: "creditCard",
    },
    {
      id: 3,
      name: "bankCredit",
    },
  ];

  const paymentOptionSelected = paymentOptions.find(
    ({ id }) => id === paymentOptionId
  );
  return typeof paymentOptionSelected === "object"
    ? paymentOptionSelected.name
    : null;
}

function calculateMonthlyPayments(paymentOptionId, priceBase, monthsNumber) {
  const paymentOptionsInterestRates = {
    creditCard: {
      ratesPerMonth: [
        {
          condition: monthsNumber <= 3,
          rate: 0.05,
        },
        {
          condition: monthsNumber <= 6,
          rate: 0.1,
        },
      ],
    },
    bankCredit: {
      ratesPerMonth: [
        {
          condition: monthsNumber <= 12,
          rate: 0.1,
        },
        {
          condition: monthsNumber <= 24,
          rate: 0.2,
        },
        {
          condition: monthsNumber <= 36,
          rate: 0.35,
        },
        {
          condition: monthsNumber <= 48,
          rate: 0.45,
        },
      ],
    },
  };

  const optionName = getPaymentOptionName(paymentOptionId);

  const selectedRate = paymentOptionsInterestRates[
    optionName
  ].ratesPerMonth.find(({ condition }) => condition === true);
  return typeof selectedRate === "object"
    ? (priceBase * (1 + selectedRate.rate)) / monthsNumber
    : null;
}

const months = {
  creditCard: [
    {
      value: 3,
      label: "3 mensualidades",
    },
    {
      value: 6,
      label: "6 mensualidades",
    },
  ],
  bankCredit: [
    {
      value: 12,
      label: "12 mensualidades",
    },
    {
      value: 24,
      label: "24 mensualidades",
    },
    {
      value: 36,
      label: "36 mensualidades",
    },
    {
      value: 48,
      label: "48 mensualidades",
    },
  ],
};

async function main() {
  const inputGroupContainers = [document.getElementById("inputGroupContainer")];
  const buttonAddReceipt = document.getElementById("addReceipt");

  function validateInputGroup(inputElement, invalidInputAlertElement) {
    const billCost = inputElement.value;
    if (billCost < 0) {
      inputElement.classList.add("input--invalid");
      invalidInputAlertElement.classList.remove("visually-hidden");
    } else {
      inputElement.classList.remove("input--invalid");
      invalidInputAlertElement.classList.add("visually-hidden");
    }
  }
  inputGroupContainers[0].addEventListener("change", () => {
    const inputGroupElement = inputGroupContainers[0].children[0];
    const inputElement = inputGroupElement.children[1];
    const invalidInputAlertElement = inputGroupContainers[0].children[1];
    validateInputGroup(inputElement, invalidInputAlertElement);
  });

  function cloneInputGroupAndAppend() {
    if (inputGroupContainers.length === 6) {
      buttonAddReceipt.removeEventListener("click", cloneInputGroupAndAppend);
      buttonAddReceipt.remove();
    }

    const newInputGroupContainer = inputGroupContainers[0].cloneNode(true);
    inputGroupContainers.push(newInputGroupContainer);
    newInputGroupContainer.removeAttribute("id");

    const inputGroupElement = newInputGroupContainer.children[0];
    const invalidInputAlertElement = newInputGroupContainer.children[1];
    invalidInputAlertElement.classList.add("visually-hidden");

    const labelElement = inputGroupElement.children[0];
    labelElement.setAttribute("for", `receipt${inputGroupContainers.length}`);
    labelElement.innerText = `Costo del recibo ${inputGroupContainers.length}`;

    const inputElement = inputGroupElement.children[1];
    inputElement.value = "";
    inputElement.classList.remove("input--invalid");
    inputElement.setAttribute("id", `receipt${inputGroupContainers.length}`);

    inputGroupContainers.slice(-2)[0].after(newInputGroupContainer);
    newInputGroupContainer.addEventListener("change", () => {
      validateInputGroup(inputElement, invalidInputAlertElement);
    });
  }
  buttonAddReceipt.addEventListener("click", cloneInputGroupAndAppend);

  const paymentOptionSelect = document.getElementById("paymentOptionSelect");
  const monthsSelect = document.getElementById("monthsSelect");

  let paymentOptionSelectedId;
  paymentOptionSelect.addEventListener("change", () => {
    paymentOptionSelectedId = paymentOptionSelect.value;

    const baseOption = monthsSelect.children[0];

    while (
      monthsSelect.children.length > 1 ||
      (monthsSelect.children.length > 1 && paymentOptionSelectedId == 1)
    ) {
      monthsSelect.removeChild(monthsSelect.lastChild);
    }
    if (paymentOptionSelectedId == 1) return null;

    const newOptions =
      months[getPaymentOptionName(Number(paymentOptionSelectedId))];
    newOptions.forEach(({ value, label }) => {
      const newOption = baseOption.cloneNode();
      newOption.removeAttribute("selected");
      newOption.setAttribute("value", value);
      newOption.innerText = label;
      monthsSelect.appendChild(newOption);
    });
  });

  let monthsSelected;
  monthsSelect.addEventListener("change", () => {
    monthsSelected = monthsSelect.value;
  });

  const buttonCalculateTotalCost = document.getElementById(
    "buttonCalculateTotalCost"
  );
  const buttonCalculateMonthlyPayments = document.getElementById(
    "buttonCalculateMonthlyPayments"
  );

  buttonCalculateTotalCost.addEventListener("click", () => {
    const billsCostSum = inputGroupContainers.reduce(
      (billsCostSum, inputGroupContainer) => {
        const inputGroupElement = inputGroupContainer.children[0];
        const inputElement = inputGroupElement.children[1];
        return billsCostSum + Number(inputElement.value);
      },
      0
    );
    const costAverageBimonthly = billsCostSum / inputGroupContainers.length;
    const totalSystemCalculation =
      getTotalSystemCalculation(costAverageBimonthly);

    alert(
      `El costo total de tu sistema sería de \$${totalSystemCalculation.panelsCost}, produciendo una energía de ${totalSystemCalculation.powerTotal} kW`
    );

    if (paymentOptionSelectedId == 1) {
      alert(
        `Tu cotización es de \$${
          totalSystemCalculation.panelsCost * 0.9
        } después del 10% de descuento`
      );
      return;
    }

    // const priceMonthly = calculateMonthlyPayments(
    //   paymentOptionSelectedId,
    //   totalSystemCalculation.panelsCost,
    //   monthsSelected
    // );
  });

  return;
}

main();
