export class PanelSystem {
  electricBills = [];
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

    this.updateLocalStorage();
  }

  deleteElectricBill(id) {
    this.electricBills = this.electricBills.filter((bill) => bill.id !== id);
    this.updateLocalStorage();
  }

  getElectricBill(id) {
    return this.electricBills.find((bill) => bill.id === id);
  }

  clearElectricBills() {
    this.electricBills = [];
    this.updateLocalStorage({ clear: true });
  }

  getTotalSystemCalculation(constants) {
    const {
      COST_PER_KW,
      PRODUCED_ENERGY_PER_KWP,
      POWER_PER_PANEL,
      PANEL_COST,
    } = constants;

    const electricBills = this.electricBills.filter(({ cost }) =>
      Boolean(cost)
    );
    const costTotal = electricBills.reduce((sum, { cost }) => sum + cost, 0.0);
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

    return (({ panelsQuantity, systemTotalPrice, powerTotal }) => ({
      panelsQuantity,
      systemTotalPrice,
      powerTotal,
    }))(this);
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
    this.finalPrice = Math.round(this.finalPrice * 100) / 100;
    return this.finalPrice;
  }

  updateLocalStorage({ clear = false } = {}) {
    if (!this.electricBills.every((bill) => bill.cost === "") || clear) {
      localStorage.setItem("electricBills", JSON.stringify(this.electricBills));
    }
  }
}
