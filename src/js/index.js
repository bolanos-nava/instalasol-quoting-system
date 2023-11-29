"use strict";

/**
 * Solar panel quoting system
 *
 * V0.1
 * See: quoting_system.md for more information
 */

function convertStringToNumberAndValidate(string) {
  let number = Number(string);
  if (isNaN(number)) {
    alert("Introduce solo valores numéricos");
    number = undefined;
  } else if (!number) {
    alert("Introdujiste texto vacío");
    number = undefined;
  }
  return number;
}

function convertPromptToNumberAndValidate(promptMessage) {
  let userPrompt = prompt(promptMessage);
  if (userPrompt === null) return null;

  return convertStringToNumberAndValidate(userPrompt);
}

function promptUserToGetAverageMonthlyCost() {
  let billsAverage;

  while (billsAverage === undefined) {
    const userPrompt = prompt(
      "Introduce lo que pagaste en tus últimos recibos para obtener un promedio mensual, separando cada cantidad de la anterior con espacios.\n" +
        "Puedes introducir hasta 6 recibos:"
    );

    if (userPrompt === "") {
      alert("Introdujiste texto vacío.");
      continue;
    }

    // if user clicks "Cancel" on the prompt, userPrompt will be null
    if (userPrompt === null) {
      billsAverage = null;
      break;
    }

    const bills = userPrompt.trim().split(/\s+/); // we clean the string of leading and trailing whitespaces and then we split it by its whitespaces
    if (bills.length > 6) {
      alert("Introdujiste más de 6 recibos");
      continue;
    }
    let billsSum = 0;
    for (const bill of bills) {
      const number = Number(bill);
      if (isNaN(number)) {
        billsSum = null;
        alert("Introdujiste caracteres no numéricos.");
        break;
      }
      billsSum += number;
    }

    if (Boolean(billsSum)) billsAverage = billsSum / (2 * bills.length); // we multiply by 2 because each electricity bill covers 2 months
  }

  return billsAverage;
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

function main() {
  alert(
    "Bienvenido a InstalaSol, empresa dedicada a la instalación de sistemas fotovoltaicos.\n" +
      "A continuación, podrás introducir el costo de tus recibos del último año para estimar el costo de tu instalación para cubrir 100% de tu consumo."
  );

  const costAverageBimonthly = promptUserToGetAverageMonthlyCost();
  if (!costAverageBimonthly) return;

  const totalSystemCalculation =
    getTotalSystemCalculation(costAverageBimonthly);

  alert(
    `El costo total de tu sistema sería de \$${totalSystemCalculation.panelsCost}, produciendo una energía de ${totalSystemCalculation.powerTotal} kW`
  );

  alert(
    "Contamos con 3 formas de pago:\n" +
      "1. Pago de contado, con el 10% de descuento\n" +
      "2. Tarjeta de crédito, pagando en hasta 6 plazos mensuales\n" +
      "3. Crédito bancario, pagando en hasta 48 meses\n"
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
    monthsNumber = convertPromptToNumberAndValidate(
      "Introduce el número de mensualidades en las que deseas pagar:"
    );
    priceMonthly = calculateMonthlyPayments(
      paymentOption,
      totalSystemCalculation.panelsCost,
      monthsNumber
    );
    if (typeof priceMonthly !== "number")
      alert(
        "Introdujiste número de meses inválido para la opción seleccionada."
      );
  } while (typeof priceMonthly !== "number");

  alert(
    `Tu cotización es de ${monthsNumber} pagos mensuales de \$${priceMonthly} cada uno`
  );
}

main();
