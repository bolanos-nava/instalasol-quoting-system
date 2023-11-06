/**
 * Solar panel quoting system
 *
 * V0.1
 * See: quoting_system.md for more information
 */

/**
 * Function to prompt the user for their bill data. Returns undefined if the inputted value is an empty string of NaN
 * @param {number} billNumber Parameter that indicates the number of bill the user is currently inputting
 * @returns number | undefined
 */
function promptUserForBillData(billNumber = 1) {
  const convertPromptToNumberAndValidate = (promptMessage) => {
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
  };

  let billCost;
  do {
    billCost = convertPromptToNumberAndValidate(
      `Introduce lo que pagaste en tu recibo ${billNumber}:`
    );
  } while (typeof billCost === "undefined");

  let billConsumption;
  do {
    billConsumption = convertPromptToNumberAndValidate(
      `Introduce el consumo del recibo ${billNumber}:`
    );
  } while (typeof billConsumption === "undefined");

  return [billCost, billConsumption];
}

function getAveragePerMonth(items = [], monthsNumber) {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += items[i];
  }
  return sum / monthsNumber;
}

function getNumberOfPanels(monthlyConsumption) {
  // TODO: implement code to calculate number of panels
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
