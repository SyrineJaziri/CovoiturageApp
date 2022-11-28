const fs = require("fs");
const MS_PER_MINUTE = 60000;

fs.readFile("./level2/input.json", "utf8", (err, json) => {
  if (err) {
    console.log("File read failed:", err);
    return;
  }

  try {
    const input = JSON.parse(json);
    var output = input.users.map((v) => ({
      user_id: v.id,
      cost: 0,
      profit: 0,
    }));
    var driver_rides = {};
    // Build driver_rides
    input.rides.forEach((ride) => {
      const { driver_id } = ride; // if the driver wasn't already added to the list
      if (!driver_rides.hasOwnProperty(driver_id)) {
        driver_rides[driver_id] = [
          {
            ...ride,
            included_passengers: [ride.passenger_id],
          },
        ];
      } else {
        // if the list of rides for the driver was already set (not empty)
        // check if ride is in the same time with another one
        var new_rides = [];
        driver_rides[driver_id].forEach((dride) => {
          if (
            Date.parse(ride.departure_at) >= Date.parse(dride.departure_at) &&
            Date.parse(ride.departure_at) <= Date.parse(dride.arrival_at)
          ) {
            // create the common ride
            new_rides.push({
              departure_at: ride.departure_at,
              arrival_at: dride.arrival_at,
              included_passengers: [
                ...dride.included_passengers,
                ride.passenger_id,
              ],
            }); // + the personnal ride
            new_rides.push({
              ...ride,
              included_passengers: [ride.passenger_id],
              departure_at: dride.arrival_at,
            }); // update dride
            dride.arrival_at = ride.departure_at;
          }
        }); // if the ride has no time in common with another one
        if (new_rides.length === 0) {
          // just add it to the list of driver rides
          driver_rides[driver_id].push({
            ...ride,
            included_passengers: [ride.passenger_id],
          });
        } else {
          // add the new_rides: changes on current rides are already done
          driver_rides[driver_id].push(...new_rides);
        }
      }
    });

    // Once driver_rides object is ready, it's time to calculate profit per ride per driver
    output.forEach((driver) => {
      if (driver_rides.hasOwnProperty(driver.user_id)) {
        driver_rides[driver.user_id].forEach((dride) => {
          // calculate the profit per ride per driver and stock it in the dride object for further calculation
          const dep = Date.parse(dride.departure_at);
          const arr = Date.parse(dride.arrival_at);
          const ride_profit = 4 * ((arr - dep) / MS_PER_MINUTE);
          driver.profit += ride_profit;
          dride.profit = ride_profit;
        });
      }
    });

    // Once the profit per ride is set, we can calculate the ride cost for a passenger
    var rides = Object.values(driver_rides).flat(1);
    output.forEach((passenger) => {
      // get all the rides including this passenger - prides: passenger rides
      prides = rides.filter(
        (ride) => ride.included_passengers.indexOf(passenger.user_id) !== -1
      );
      passenger.cost = prides.reduce(
        (total_cost, ride) =>
          total_cost + ride.profit / ride.included_passengers.length,
        0
      );
    });
  } catch (error) {
    console.log({ error });
  }

  fs.writeFile("./level2/output.json", JSON.stringify(output), (err) => {
    if (err) console.log("File write failed:", err);
    else {
      console.log("File written successfully\n");
      console.log({ output });
    }
  });
});
