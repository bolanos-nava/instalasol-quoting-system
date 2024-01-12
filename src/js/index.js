"use strict";

import { ElectricBill } from "./modules/ElectricBill.js";
import { PanelSystem } from "./modules/PanelSystem.js";
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

const billInputContainerTemplate = document.getElementById(
  "billInputContainerTemplate"
);
const billInputsList = document.getElementById("billInputsList");
const inputGroupContainers = [document.getElementById("inputGroupContainer")];
const buttonAddReceipt = document.getElementById("addReceipt");
const paymentOptionSelect = document.getElementById("paymentOptionSelect");
const monthsSelect = document.getElementById("monthsSelect");
const monthsSelectContainer = document.getElementById("monthsSelectContainer");
const buttonCalculateTotalCost = document.getElementById(
  "buttonCalculateTotalCost"
);
const buttonCalculateMonthlyPayments = document.getElementById(
  "buttonCalculateMonthlyPayments"
);

function validateInputGroup(inputElement, invalidInputAlertElement) {
  const inputValue = inputElement.value;
  if (inputValue < 0) {
    inputElement.classList.add("input--invalid");
    invalidInputAlertElement.classList.remove("visually-hidden");
  } else {
    inputElement.classList.remove("input--invalid");
    invalidInputAlertElement.classList.add("visually-hidden");
  }
}

let appendedBills = 0;
function deleteInputGroupTemplateClone(id) {
  if (!appendedBills) return;

  appendedBills--;
  document.getElementById(id).remove();
}

function cloneInputGroupTemplate(panelSystem) {
  if (appendedBills === 6) return;
  const currentBill = ++appendedBills;

  const billInputContainer = billInputContainerTemplate.content.cloneNode(true);

  const elements = {
    costLabel: null,
    costInput: null,
    btnBillDelete: null,
    invalidInputAlert: null,
  };
  for (const id in elements) {
    const element = billInputContainer.getElementById(id);
    element.removeAttribute("id");
    elements[id] = element;
  }

  elements.costLabel.setAttribute("for", `receipt${currentBill}`);
  elements.costLabel.innerText = `Costo del recibo ${currentBill}`;

  elements.costInput.setAttribute("id", `receipt${currentBill}`);
  elements.costInput.value =
    panelSystem.getElectricBill(currentBill)?.cost || "";

  elements.costInput.onchange = () => {
    validateInputGroup(elements.costInput, elements.invalidInputAlert);
    // panelSystem.addElectricBill(0.0);
    panelSystem.addElectricBill(
      new ElectricBill(currentBill, elements.costInput.value)
    );
  };
  elements.btnBillDelete.onclick = () => {
    if (appendedBills > 1) {
      console.log({ appendedBills, currentBill });
      panelSystem.deleteElectricBill(currentBill);
      console.log({ bills: [...panelSystem.electricBills] });
      appendedBills--;
      renderBillInputsList(panelSystem, { reset: false });
    }
  };

  billInputsList.appendChild(billInputContainer);

  if (currentBill === 6) {
    buttonAddReceipt.classList.add("visually-hidden");
  }
}

function renderBillInputsList(panelSystem, { reset = true } = {}) {
  billInputsList.innerHTML = "";
  const { electricBills } = panelSystem;
  console.log({ ...panelSystem });
  const electricBillsQuantity = reset ? electricBills.length : appendedBills;
  appendedBills = 0;
  console.log(electricBillsQuantity);

  if (!electricBillsQuantity) cloneInputGroupTemplate(panelSystem);
  else {
    for (let i = 0; i < electricBillsQuantity; i++) {
      console.log(i);
      cloneInputGroupTemplate(panelSystem);
    }
  }
}

async function main() {
  let billsArray = [
    {
      id: 1,
      cost: 5000,
    },
    {
      id: 2,
      cost: 2000,
    },
  ];
  // localStorage.setItem("bills", JSON.stringify(billsArray));
  const lsBills =
    JSON.parse(localStorage.getItem("bills"))?.map(
      (bill) => new ElectricBill(bill.id, bill.cost)
    ) || [];
  // const lsBills = localStorage.getItem("bills") || [];
  const panelSystem = new PanelSystem(lsBills);
  console.log({ ...panelSystem });
  const render = () => renderBillInputsList(panelSystem);

  render();

  buttonAddReceipt.addEventListener("click", () =>
    cloneInputGroupTemplate(panelSystem)
  );

  return;

  paymentOptionSelect.addEventListener("change", () => {
    const paymentOptionSelectedId = paymentOptionSelect.value;

    const baseOption = monthsSelect.children[0];

    while (
      monthsSelect.children.length > 1 ||
      (monthsSelect.children.length > 1 && paymentOptionSelectedId == 1)
    ) {
      monthsSelect.removeChild(monthsSelect.lastChild);
    }

    if (paymentOptionSelectedId == 1) {
      [monthsSelectContainer, buttonCalculateMonthlyPayments].forEach((el) =>
        el.classList.add("visually-hidden")
      );
      return null;
    } else {
      [monthsSelectContainer, buttonCalculateMonthlyPayments].forEach((el) =>
        el.classList.remove("visually-hidden")
      );
    }

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
