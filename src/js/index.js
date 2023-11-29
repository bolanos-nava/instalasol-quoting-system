"use strict";

/**
 * Solar panel quoting system
 *
 * V0.1
 * See: quoting_system.md for more information
 */

function convertPromptToNumberAndValidate(promptMessage) {
  let userPrompt = prompt(promptMessage);
  if (userPrompt === null) return null;

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
  const sum = items.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  return sum / monthsNumber;
}

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

function calculateMonthlyPayments(option, priceBase, monthsNumber) {
  const getPriceFinal = (interestRate) => priceBase * (1 + interestRate);

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

  const selectedRate = paymentOptionsInterestRates[option].ratesPerMonth.find(
    ({ condition }) => condition === true
  );
  return typeof selectedRate === "object"
    ? getPriceFinal(selectedRate.rate) / monthsNumber
    : undefined;
}

function main() {
  alert(
    "Bienvenido a InstalaSol, empresa dedicada a la instalación de sistemas fotovoltaicos.\n" +
      "A continuación, podrás introducir el costo de tus tres últimos recibos de electricidad para estimar el costo de la instalación en tu residencia."
  );
  let costsSum = 0;
  for (let i = 1; i <= 3; i++) {
    const cost = promptUserForBillData(i);
    if (cost === null) break;
    costsSum += cost;
  }
  if (!costsSum) return;
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
  if (paymentOption === null) return;

  if (paymentOption === 1) {
    alert(
      `Tu cotización es de \$${
        totalSystemCalculation.panelsCost * 0.9
      } después del 10% de descuento`
    );
    return;
  }

  let priceMonthly = 0;
  let monthsNumber = 0;
  do {
    monthsNumber =
      paymentOption === 2 || paymentOption === 3
        ? convertPromptToNumberAndValidate(
            "Introduce el número de mensualidades que deseas:"
          )
        : undefined;
    priceMonthly = calculateMonthlyPayments(
      paymentOption,
      totalSystemCalculation.panelsCost,
      monthsNumber
    );
    if (typeof priceMonthly === "undefined")
      alert(
        "Introdujiste número de meses inválido para la opción seleccionada."
      );
  } while (typeof priceMonthly === "undefined");

  alert(
    `Tu cotización es de ${monthsNumber} pagos mensuales de \$${priceMonthly} cada uno`
  );
}

main();
