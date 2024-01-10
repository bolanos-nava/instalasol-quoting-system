export class ElectricBill {
  id = null;
  cost = 0.0;

  constructor(id, cost) {
    this.id = id;
    this.cost = Number(cost) ?? this.cost;
  }
}
