export class PanelSystem {
  electricBills = [];
  total;
  panelsQuantity = 0;
  systemTotalPrice = 0.0;
  powerTotal = 0.0;
  finalPrice = 0.0;

  constructor(electricBills) {
    this.electricBills = electricBills ?? this.electricBills;
  }

  addElectricBill(electricBill) {
    const billAlreadyAdded = this.electricBills.find(
      (bill) => bill.id === electricBill.id
    );
    if (billAlreadyAdded) {
      billAlreadyAdded.cost = electricBill.cost;
    } else {
      this.electricBills.push(electricBill);
    }
  }

  getTotalSystemCalculation(constants) {
    const {
      COST_PER_KW,
      PRODUCED_ENERGY_PER_KWP,
      POWER_PER_PANEL,
      PANEL_COST,
    } = constants;

    const costTotal = this.electricBills.reduce(
      (sum, bill) => sum + bill.cost,
      0.0
    );
    const months = electricBills.length * 2; // multiply by 2 because every bill covers two months
    const costAverageBimonthly = costTotal / months;

    const consumptionBimonthly = costAverageBimonthly / COST_PER_KW;
    const consumptionAverageDaily = consumptionBimonthly / 60;

    const kwpRequired = consumptionAverageDaily / PRODUCED_ENERGY_PER_KWP;

    this.panelsQuantity = parseInt(
      (kwpRequired * 1000) / POWER_PER_PANEL + 1.0
    ); // we add 1 to round up
    this.systemTotalPrice = this.panelsQuantity * PANEL_COST;
    this.powerTotal = (this.panelsQuantity * POWER_PER_PANEL) / 1000;

    return ({ panelsQuantity, systemTotalPrice, powerTotal } = this);
  }

 
  getFinalPrice(paymentOptionId, months, interestRate) {
    switch (paymentOptionId) {
      case 1:
        this.finalPrice = this.systemTotalPrice * 0.9;
        break;
      case 2:
      case 3:
        this.finalPrice =
          (this.systemTotalPrice * (1.0 + interestRate)) / months;
        break;
    }
    return this.finalPrice;
  }
}
