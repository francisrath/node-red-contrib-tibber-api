const TibberQuery = require("tibber-api").TibberQuery;

module.exports = function(RED) {
  function TibberNotifyNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    config.apiEndpoint = RED.nodes.getNode(config.apiEndpointRef);
    node._config = config;

    if (!config.apiEndpoint.queryUrl || !config.apiEndpoint.apiKey) {
      node.error("Missing mandatory parameters (queryUrl and/or apiKey)");
      return;
    }

    node.client = new TibberQuery(config);

    node.on("input", async function(msg) {
      var title = node._config.notifyTitle
        ? node._config.notifyTitle
        : msg.payload.title;
      var message = node._config.notifyMessage
        ? node._config.notifyMessage
        : msg.payload.message;
      var screen = node._config.notifyScreen
        ? node._config.notifyScreen
        : msg.payload.screen;
      screen = screen ? screen : "HOME";

      if (!title || !message) {
        node.error("Missing mandatory parameters (title and/or message)");
        return;
      }

      var query =
        'mutation{sendPushNotification(input: {title: "' +
        title +
        '", message: "' +
        message +
        '", screenToOpen: ' +
        screen +
        "}){successful pushedToNumberOfDevices}}";
      var result = await node.client.query(query);
      if (result.error) {
        node.error(JSON.stringify(result));
      } else {
        node.log(JSON.stringify(result));
      }
    });
  }

  RED.nodes.registerType("tibber-notify", TibberNotifyNode);
};
