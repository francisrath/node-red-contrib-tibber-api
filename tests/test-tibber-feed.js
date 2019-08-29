/* eslint-env mocha */
const TibberFeed = require('../nodes/TibberFeed');
const assert = require('assert');
const WebSocket = require('ws');

describe('TibberFeed', function () {
  let server = undefined;
  let sockets = [];

  before(function (done) {
    server = new WebSocket.Server({ port: 1337 });
    server.on('connection', function (socket) {
      sockets.push(socket);
      // When you receive a message, send that message to every socket.
      socket.on('message', function (msg) {
        let obj = JSON.parse(msg);
        if (obj.type == 'connection_init' && obj.payload == 'token=1337') {
          obj.type = 'connection_ack';
          socket.send(JSON.stringify(obj));
        } else if (obj.type == 'start' && obj.payload.query.startsWith('subscription{liveMeasurement(homeId:"1337"){')) {
          obj = { type: 'data', payload: { data: { liveMeasurement: { value: 1337 } } } };
          socket.send(JSON.stringify(obj));
        }
      });
      // When a socket closes, or disconnects, remove it from the array.
      socket.on('close', function () {
        sockets = sockets.filter(s => s !== socket);
      });
    });
    done();
  });

  after(function (done) {
    if (server) {
      server.close();
    }
    done();
  });

  describe('create', function () {
    it('Should be created', function () {
      let feed = new TibberFeed({ apiUrl: 'http://localhost:1337', apiToken: '1337', homeId: '1337', active: true });
      assert.ok(feed);
    });
  });

  describe('connect', function () {
    it('Should be connected', function (done) {
      let feed = new TibberFeed({ apiUrl: 'http://localhost:1337', apiToken: '1337', homeId: '1337', active: true });
      feed.events.on('connection_ack', function (data) {
        assert.ok(data);
        assert.equal(data.payload, 'token=1337');
        done();
      });
      feed.connect();
    });
  });

  describe('receive', function () {
    it('Should receive data', function (done) {
      let feed = new TibberFeed({ apiUrl: 'http://localhost:1337', apiToken: '1337', homeId: '1337', active: true });
      feed.events.on('data', function (data) {
        assert.ok(data);
        assert.equal(data.value, 1337);
        done();
      });
      feed.connect();
    });
  });

  describe('active', function () {
    it('Should be active', function () {
      let feed = new TibberFeed({ apiUrl: 'http://localhost:1337', apiToken: '1337', homeId: '1337', active: true });
      assert.equal(feed.active, true);
    });
  });

  describe('inactive', function () {
    it('Should be inactive', function () {
      let feed = new TibberFeed({});
      assert.equal(feed.active, false);
    });
  });

  describe('timeout', function () {
    it('Should timeout after 1 sec', function (done) {
      let feed = new TibberFeed({ apiUrl: 'http://localhost:1337', apiToken: '1337', homeId: '1337', active: true }, 1000);
      let called = false;
      feed.events.on('disconnected', function (data) {
        assert.ok(data);
        if (!called){
          called = true;
          done();
        }

      });
      feed.connect();
    });
  });


});
