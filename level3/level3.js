const fs = require("fs");
const MS_PER_MINUTE = 60000;

fs.readFile("./level3/input.json", "utf8", (err, json) => {
  if (err) {
    console.log("File read failed:", err);
    return;
  }

  try {
    const input = JSON.parse(json);
    // resolve missing property
    Object.defineProperty(Array.prototype, "flat", {
      value: function (depth = 1) {
        return this.reduce(function (flat, toFlatten) {
          return flat.concat(
            Array.isArray(toFlatten) && depth > 1
              ? toFlatten.flat(depth - 1)
              : toFlatten
          );
        }, []);
      },
    });

    const isEligible = (lat, lng, sponsorship) => {
      const { eligibility_bbox } = sponsorship;

      // latitude check
      if (lat >= eligibility_bbox[0][0] && lat <= eligibility_bbox[1][0]) {
        // latitude is checked, let's check longitude
        if (lng >= eligibility_bbox[0][1] && lng <= eligibility_bbox[1][1]) {
          // allisgood<w
          return true;
        }
        // longitude is not in
        return false;
      }
      // latitude in not in
      return false;
    };

    var output = input.users.map((u) => {
      var available_spons = [];
      input.sponsorships.forEach((s) => {
        // check home eligibility
        if (isEligible(u.home_lat, u.home_lng, s)) {
          available_spons.push(s.amount);
        }
        // check work eligibility
        if (isEligible(u.work_lat, u.work_lng, s)) {
          available_spons.push(s.amount);
        }
      });

      return {
        user_id: u.id,
        cost: 0,
        profit: 0,
        sponsorships: available_spons,
      };
    });

    var driver_rides = {};
    // Build driver_rides
    input.rides.forEach((ride) => {
      const { driver_id } = ride;
      // if the driver wasn't already added to the list
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
              id: [dride.id, ride.id],
              departure_at: ride.departure_at,
              arrival_at: dride.arrival_at,
              included_passengers: [
                ...dride.included_passengers,
                ride.passenger_id,
              ],
            });

            // + the personnal ride
            new_rides.push({
              ...ride,
              included_passengers: [ride.passenger_id],
              departure_at: dride.arrival_at,
            });

            // update dride
            dride.arrival_at = ride.departure_at;
          }
        });

        // if the ride has no time in common with another one
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

    // Once the profit per ride is set, we can calculate the ride cost for a each passenger
    var rides = Object.values(driver_rides).flat(1);
    var rides_cost = {};
    const add_ride = (rides_cost, ride_id, ride_cost) => {
      if (rides_cost.hasOwnProperty(ride_id)) {
        rides_cost[ride_id] += ride_cost;
      } else {
        rides_cost[ride_id] = ride_cost;
      }
    };

    // Populate the variable "rides_cost" which represent the cost per ride
    rides.forEach((ride) => {
      const cost = ride.profit / ride.included_passengers.length;
      if (Array.isArray(ride.id)) {
        ride.id.forEach((ride_id) => {
          add_ride(rides_cost, ride_id, cost);
        });
      } else {
        add_ride(rides_cost, ride.id, cost);
      }
    });

    // Calculate the final ride_cost per passenger (including sponsorships)
    output.forEach((passenger) => {
      // get all the rides including this passenger - prides: passenger rides
      prides = rides.filter(
        (ride) => ride.included_passengers.indexOf(passenger.user_id) !== -1
      );
      passenger.cost = input.rides
        .filter((ride) => ride.passenger_id === passenger.user_id)
        .reduce((total_cost, ride) => {
          var ride_cost = rides_cost.hasOwnProperty(ride.id)
            ? rides_cost[ride.id]
            : 0;

          // apply sponorships
          passenger.sponsorships.some((s) => {
            if (ride_cost - s >= 0) {
              ride_cost -= s;
            } else {
              ride_cost = 0;
              return true;
            }
          });

          return total_cost + ride_cost;
        }, 0);

      // unset sponsorships property
      delete passenger.sponsorships;
    });
  } catch (error) {
    console.log({ error });
  }

  fs.writeFile("./level3/output.json", JSON.stringify(output), (err) => {
    if (err) console.log("File write failed:", err);
    else {
      console.log("File written successfully\n");
      console.log({ output });
    }
  });
});
