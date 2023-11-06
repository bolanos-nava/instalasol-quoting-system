# Solar panel quoting system

## V0.1
### Steps of the algorithm:
1. The user inputs the consumption of their last three electric bills. Since every bills is bimonthly, we would be getting the history of the last 6 months.
2. Calculate the average monthly consumption in kWh and the average monthly amount they pay
3. Calculate the number of solar panels the user needs based on the monthly consumption.
4. Show the user the total cost of installation based on three different payment forms:
   * In one exhibition with 10% discount over the base price.
   * With credit card, up to 6 monthly payments with interest.
   * With bank credit, up to 48 monthly payments with interest.