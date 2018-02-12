
var Self = this;
this.getUser = function (callback) {
  Self.send("GET_USER", {}, callback)
}
