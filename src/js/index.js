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
const billInputContainerTemplate = document.getElementById(
  "billInputContainerTemplate"
);
const billInputsList = document.getElementById("billInputsList");
const buttonAddReceipt = document.getElementById("addReceipt");
const paymentOptionSelect = document.getElementById("paymentOptionSelect");
const monthsSelect = document.getElementById("monthsSelect");
const monthsSelectContainer = document.getElementById("monthsSelectContainer");
const buttonCalculateTotalCost = document.getElementById(
  "buttonCalculateTotalCost"
);
const totalCost = document.getElementById("totalCost");
const monthlyCost = document.getElementById("monthlyCost");

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
function cloneInputGroupTemplate(panelSystem, existingBill) {
  if (appendedBills === 6) return;
  const currentBill = ++appendedBills;

  let electricBill;
  if (!existingBill) {
    const { electricBills } = panelSystem;
    const nextId = electricBills.length
      ? electricBills[electricBills.length - 1].id + 1
      : 1;
    electricBill = new ElectricBill(nextId);
  } else {
    electricBill = existingBill;
  }
  panelSystem.addElectricBill(electricBill);

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
  elements.costInput.value = electricBill.cost || "";

  elements.costInput.onchange = () => {
    validateInputGroup(elements.costInput, elements.invalidInputAlert);
    electricBill.cost = elements.costInput.value;
    panelSystem.updateLocalStorage();
  };
  elements.btnBillDelete.onclick = () => {
    if (panelSystem.electricBills.length > 1) {
      panelSystem.deleteElectricBill(electricBill.id);
      renderBillInputsList(panelSystem);
    }
  };

  billInputsList.appendChild(billInputContainer);

  currentBill === 6
    ? buttonAddReceipt.classList.add("visually-hidden")
    : buttonAddReceipt.classList.remove("visually-hidden");
}

function renderBillInputsList(panelSystem) {
  billInputsList.innerHTML = "";
  appendedBills = 0;

  const { electricBills } = panelSystem;
  const electricBillsQuantity = electricBills.length;
  if (!electricBillsQuantity) cloneInputGroupTemplate(panelSystem);
  else {
    electricBills.forEach((bill) => cloneInputGroupTemplate(panelSystem, bill));
  }
}

async function main() {
  let constants = await getConstants();
  constants = await constants.json();

  const lsBills =
    JSON.parse(localStorage.getItem("electricBills"))?.map(
      (bill) => new ElectricBill(bill.id, bill._cost)
    ) || [];
  const panelSystem = new PanelSystem(lsBills);
  renderBillInputsList(panelSystem);

  buttonAddReceipt.addEventListener("click", () =>
    cloneInputGroupTemplate(panelSystem)
  );

  paymentOptionSelect.addEventListener("change", () => {
    const paymentOptionSelectedId = Number(paymentOptionSelect.value);

    // we clean the options of monthsSelect
    while (monthsSelect.children.length > 1)
      monthsSelect.removeChild(monthsSelect.lastChild);

    paymentOptionSelectedId === 1
      ? monthsSelectContainer.classList.add("visually-hidden")
      : monthsSelectContainer.classList.remove("visually-hidden");

    const newOptions = constants.paymentOptions
      .find((option) => option.id === paymentOptionSelectedId)
      .interestRates.map(({ months }) => ({
        value: months,
        label: `${months} mensualidades`,
      }));
    newOptions.forEach(({ months }) => {
      const newOption = monthsSelect.children[0].cloneNode();
      newOption.removeAttribute("selected");
      newOption.setAttribute("value", months);
      newOption.innerText = `${months} mensualidades`;
      monthsSelect.appendChild(newOption);
    });
  });

  buttonCalculateTotalCost.addEventListener("click", () => {
    const { panelsQuantity, systemTotalPrice, powerTotal } =
      panelSystem.getTotalSystemCalculation(constants.panelSystemConstants);

    totalCost.innerText = `Costo total: $${systemTotalPrice}. Energía producida: ${powerTotal} kW`;

    const paymentOptionSelectedId = Number(paymentOptionSelect.value);

    if (paymentOptionSelectedId === 1) {
      monthlyCost.innerText = `Costo final con el 10% de descuento: $${
        0.9 * systemTotalPrice
      } MXN`;
    } else {
      const monthsSelected = Number(monthsSelect.value);
      const interestRate = constants.paymentOptions
        .find(({ id }) => id === paymentOptionSelectedId)
        .interestRates.find(({ months }) => months === monthsSelected).rate;
      const finalPrice = panelSystem.getFinalPrice(
        paymentOptionSelectedId,
        monthsSelected,
        interestRate
      );
      monthlyCost.innerText = `Pagos mensuales: ${monthsSelected} pagos mensuales de $${finalPrice} MXN cada uno`;
    }
  });

  return;
}

main();
