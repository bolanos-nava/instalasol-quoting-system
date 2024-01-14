"use strict";

import { ElectricBill } from "./src/js/modules/ElectricBill.js";
import { PanelSystem } from "./src/js/modules/PanelSystem.js";
import { getConstants } from "./src/js/modules/fetchers.js";

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
const buttonClean = document.getElementById("buttonClean");
const totalCost = document.getElementById("totalCost");
const monthlyCost = document.getElementById("monthlyCost");
const emailInput = document.getElementById("emailInput");
const invalidEmailAlert = document.getElementById("invalidEmailAlert");
const buttonSendQuotation = document.getElementById("buttonSendQuotation");

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

  let lsBills =
    JSON.parse(localStorage.getItem("electricBills"))
      ?.filter((bill) => bill._cost !== "")
      ?.map((bill) => new ElectricBill(bill.id, bill._cost)) || [];
  const panelSystem = new PanelSystem(lsBills);
  renderBillInputsList(panelSystem);

  buttonAddReceipt.onclick = () => cloneInputGroupTemplate(panelSystem);
  paymentOptionSelect.onchange = () => {
    buttonSendQuotation.setAttribute("disabled", true);
    totalCost.innerText = "";
    monthlyCost.innerText = "";
    const paymentOptionSelectedId = Number(paymentOptionSelect.value);
    if (isNaN(paymentOptionSelectedId) || paymentOptionSelectedId >= 2)
      buttonCalculateTotalCost.setAttribute("disabled", true);
    else if (paymentOptionSelectedId === 1)
      buttonCalculateTotalCost.removeAttribute("disabled");

    // we clean the options of monthsSelect
    while (monthsSelect.children.length > 1)
      monthsSelect.removeChild(monthsSelect.lastChild);

    paymentOptionSelectedId === 1
      ? monthsSelectContainer.classList.add("visually-hidden")
      : monthsSelectContainer.classList.remove("visually-hidden");

    // finding the interest rates of the selected payment option
    const interestRatesForSelectedOption = constants.paymentOptions.find(
      (option) => option.id === paymentOptionSelectedId
    )?.interestRates;

    // if there are no interest rates for that option, then just return
    if (!interestRatesForSelectedOption) return;

    interestRatesForSelectedOption.forEach(({ months }) => {
      const newOption = monthsSelect.children[0].cloneNode();
      newOption.removeAttribute("selected");
      newOption.setAttribute("value", months);
      newOption.innerText = `${months} mensualidades`;
      monthsSelect.appendChild(newOption);
    });
  };
  monthsSelect.onchange = (e) => {
    buttonSendQuotation.setAttribute("disabled", true);
    const monthsSelectedId = Number(e.target.value);

    if (isNaN(monthsSelectedId))
      buttonCalculateTotalCost.setAttribute("disabled", true);
    else buttonCalculateTotalCost.removeAttribute("disabled");
  };

  buttonCalculateTotalCost.onclick = () => {
    const { panelsQuantity, systemTotalPrice, powerTotal } =
      panelSystem.getTotalSystemCalculation(constants.panelSystemConstants);

    totalCost.innerText = `Costo total: $${systemTotalPrice}. Energía producida: ${powerTotal} kW. Módulos del sistema: ${panelsQuantity}`;

    const paymentOptionSelectedId = Number(paymentOptionSelect.value);

    if (isNaN(paymentOptionSelectedId) || paymentOptionSelectedId >= 2)
      buttonSendQuotation.setAttribute("disabled", true);

    switch (paymentOptionSelectedId) {
      case 1: {
        monthlyCost.innerText = `Costo final con el 10% de descuento: $${
          0.9 * systemTotalPrice
        } MXN`;
        buttonSendQuotation.removeAttribute("disabled");
        return;
      }
      case 2:
      case 3: {
        const monthsSelected = Number(monthsSelect.value);
        const interestRate = constants.paymentOptions
          .find(({ id }) => id === paymentOptionSelectedId)
          .interestRates.find(({ months }) => months === monthsSelected).rate;
        const finalPrice = panelSystem.getFinalPrice(
          paymentOptionSelectedId,
          monthsSelected,
          interestRate
        );
        monthlyCost.innerText = `Pagos mensuales: ${monthsSelected} pagos de $${finalPrice} MXN cada uno`;
        buttonSendQuotation.removeAttribute("disabled");
        return;
      }
      default: {
        monthlyCost.innerText = "";
        return;
      }
    }
  };

  buttonClean.onclick = () => {
    monthlyCost.innerText = "";
    totalCost.innerText = "";
    panelSystem.clearElectricBills();
    monthsSelectContainer.classList.remove("visually-hidden");
    renderBillInputsList(panelSystem);
  };

  emailInput.onblur = (event) => {
    const value = event.target.value;
    const isValidEmail = value.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
    if (value === "" || !isValidEmail) {
      event.target.classList.add("input--invalid");
      invalidEmailAlert.classList.remove("visually-hidden");
      buttonSendQuotation.setAttribute("disabled", true);
    } else {
      event.target.classList.remove("input--invalid");
      invalidEmailAlert.classList.add("visually-hidden");
      buttonSendQuotation.removeAttribute("disabled");
    }
  };

  buttonSendQuotation.addEventListener("click", (e) => {
    e.preventDefault();

    const EMAILJS = {
      SERVICE_ID: "default_service",
      TEMPLATE_ID: "template_428j37r",
    };
    emailjs
      .send("default_service", "quotation_template", {
        to_name: emailInput.value,
        to_email: emailInput.value,
        power_total: panelSystem.powerTotal,
        panels_quantity: panelSystem.panelsQuantity,
        system_total_price: panelSystem.systemTotalPrice,
        final_price: (() => {
          switch (Number(paymentOptionSelect.value)) {
            case 1:
              return `Costo final: $${panelSystem.finalPrice} después del 10% de descuento.`;
            case 2:
            case 3:
              return `Pagos mensuales: ${monthsSelect.value} pagos de $${panelSystem.finalPrice}`;
          }
        })(),
      })
      .then(
        () => {
          emailInput.value = "";
          Swal.fire({
            title: "¡Correo enviado con éxito!",
            text: "Tu cotización pronto te llegará por correo",
            icon: "success",
          });
        },
        () => {
          Swal.fire({
            title: "Correo no enviado",
            text: "Inténtelo de nuevo más tarde",
            icon: "error",
          });
        }
      );
  });

  return;
}

main();
