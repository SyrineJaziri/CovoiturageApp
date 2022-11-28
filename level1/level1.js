const fs = require("fs");
fs.readFile("./level1/input.json", "utf8", (err, json) => {
  if (err) {
    console.log("File read failed:", err);
    return;
  }

  const input = JSON.parse(json);
  var output = [];
  input["users"].forEach(user => {
    var cost = 0, 
        profit = 0, 
        user_id = user["id"];
    
    // collect the rides including this user
    input["rides"].forEach(ride => {
        var driver = input["users"]?.find(user => user["id"] === ride["driver_id"])
        var ride_cost = driver["passengers_cost_per_km"] * (ride["distance"] / 1000)

        if(user_id === ride["driver_id"]) 
            profit += ride_cost
        if(user_id === ride["passenger_id"])
            cost += ride_cost

    })

    output.push({
        user_id,
        cost,
        profit
    })
  });
  
  fs.writeFile("./level1/output.json", JSON.stringify(output), (err) => {
    if (err)
      console.log("File write failed:", err);
    else {
      console.log("File written successfully\n");
      console.log({ output })
    }
  });
});