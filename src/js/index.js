"use strict";

/**
 * Solar panel quoting system
 *
 * V0.1
 * See: quoting_system.md for more information
 */

function convertPromptToNumberAndValidate(promptMessage) {
  let userPrompt = prompt(promptMessage);
  userPrompt = Number(userPrompt);
  if (isNaN(userPrompt)) {
    alert("Introduce solo valores numéricos");
    userPrompt = undefined;
  } else if (!userPrompt) {
    alert("Introdujiste texto vacío");
    userPrompt = undefined;
  }
  return userPrompt;
}

/**
 * Function to prompt the user for their bill data. Returns undefined if the inputted value is an empty string of NaN
 * @param {number} billNumber Parameter that indicates the number of bill the user is currently inputting
 * @returns number | undefined
 */
function promptUserForBillData(billNumber = 1) {
  let billCost;
  do {
    billCost = convertPromptToNumberAndValidate(
      `Introduce lo que pagaste en tu recibo ${billNumber} para calcular el costo de tu instalación:`
    );
  } while (typeof billCost === "undefined");

  // let billConsumption;
  // do {
  //   billConsumption = convertPromptToNumberAndValidate(
  //     `Introduce el consumo del recibo ${billNumber}:`
  //   );
  // } while (typeof billConsumption === "undefined");

  return billCost;
}

function getAveragePerMonth(items = [], monthsNumber) {
  let sum = 0;
  for (const item of items) {
    sum += item;
  }
  return sum / monthsNumber;
}

function getTotalSystemCalculation(costAverageBimonthly) {
  // TODO: implement code to calculate number of panels

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

function calculateMonthlyPayments(option, priceBase, monthsNumber) {
  const ONE_EXHIBITION = 1;
  const CREDIT_CARD = 2;
  const BANK_CREDIT = 3;

  const getPriceFinal = (interestRate) => priceBase * (1 + interestRate);

  let priceMonthly = 0;
  switch (option) {
    case ONE_EXHIBITION:
      priceMonthly = priceBase * 0.9;
      break;
    case CREDIT_CARD: {
      const INTEREST_RATES = [0.05, 0.1];
      switch (monthsNumber) {
        case 3:
          priceMonthly = getPriceFinal(INTEREST_RATES[0]) / monthsNumber;
          break;
        case 6:
          priceMonthly = getPriceFinal(INTEREST_RATES[1]) / monthsNumber;
          break;
      }
      break;
    }
    case BANK_CREDIT:
      {
        const INTEREST_RATES = [0.1, 0.2, 0.35, 0.45];
        switch (monthsNumber) {
          case 12:
            priceMonthly = getPriceFinal(INTEREST_RATES[0]) / monthsNumber;
            break;
          case 24:
            priceMonthly = getPriceFinal(INTEREST_RATES[1]) / monthsNumber;
            break;
          case 36:
            priceMonthly = getPriceFinal(INTEREST_RATES[2]) / monthsNumber;
            break;
          case 48:
            priceMonthly = getPriceFinal(INTEREST_RATES[3]) / monthsNumber;
            break;
        }
      }
      break;
  }
  return priceMonthly;
}

function main() {
  let costsSum = 0;
  for (let i = 1; i <= 3; i++) {
    const cost = promptUserForBillData(i);
    costsSum += cost;
    console.log({ i, cost, costsSum });
  }
  const costAverageBimonthly = costsSum / 6;

  const totalSystemCalculation =
    getTotalSystemCalculation(costAverageBimonthly);

  alert(
    `El costo total de tu sistema sería de \$${totalSystemCalculation.panelsCost}, produciendo una energía de ${totalSystemCalculation.powerTotal} kW`
  );

  alert(
    "Contamos con 3 formas de pago: \n" +
      "1. Pago de contado, con el 10% de descuento \n" +
      "2. Tarjeta de crédito, pagando en hasta 6 plazos mensuales \n" +
      "3. Crédito bancario, pagando hasta en 48 meses"
  );
  const paymentOption = convertPromptToNumberAndValidate(
    "Introduce el número de opción que deseas:"
  );
  const monthsNumber =
    paymentOption === 2 || paymentOption === 3
      ? convertPromptToNumberAndValidate(
          "Introduce el número de mensualidades que deseas:"
        )
      : undefined;

  const priceMonthly = calculateMonthlyPayments(
    paymentOption,
    totalSystemCalculation.panelsCost,
    monthsNumber
  );

  alert(
    `Tu cotización es de ${monthsNumber} pagos mensuales de \$${priceMonthly} cada uno`
  );
}

main();
