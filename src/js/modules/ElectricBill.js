export class ElectricBill {
  id = null;
  _cost = "";

  constructor(id, cost) {
    this.id = id;

    const parsedCost = Number(cost);
    if (cost === "" || isNaN(parsedCost)) {
      this._cost = "";
    } else {
      this._cost = parsedCost;
    }
  }

  get cost() {
    return this._cost;
  }

  set cost(cost) {
    const parsedCost = Number(cost);

    if (cost === "" || isNaN(parsedCost)) {
      this._cost = "";
    } else {
      this._cost = parsedCost;
    }
  }

  isElectricBillUndefined() {
    return isNaN(this._cost);
  }
}
