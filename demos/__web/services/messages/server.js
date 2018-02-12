
// This runs at the startup of the service
this.on("start", function (callback) {
  console.log("SERVER", this.data);
  callback();
})

// Goes second, after on start
// this.on("running", function (callback) {
// })


this.on("message", function (endpoint, data, callback) {
    console.log('MESSAGE', arguments)
  switch(endpoint) {
    case "GET_USER":
      callback(null, {user: "Davide"})
    break;
  }
})
