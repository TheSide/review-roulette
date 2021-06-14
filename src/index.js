const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = require("./app.js");
const config = require("../config.js");
const serverless = require('serverless-http');

const server = express();
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(
  `${config.baseUrl}`,
  express.static(path.join(__dirname, "/public"))
);

/**
 * Returns the installation link
 */
router.get(`${config.baseUrl}/install-link`, (req, res) => {
  res.send(
    `https://slack.com/oauth/authorize?scope=commands&client_id=${
      config.client_id
    }&redirect_uri=${encodeURIComponent(
      `${config.siteUrl}${config.baseUrl}/install`
    )}`
  );
});

/**
 * Users are redirected here during installation on a workspace
 */
router.get(`${config.baseUrl}/install`, app.install);

/**
 * When a user types a /roulette command
 */
router.post(`${config.baseUrl}/command`, app.processCommand);

/**
 * When a user sends an action
 */
router.post(`${config.baseUrl}/action`, app.processAction);

console.log("le port : " + process.env.PORT)

server.use('/', router);  // path must route to lambda

module.exports = server;
module.exports.handler = serverless(server);
/*
server.listen(process.env.PORT || config.port, () =>
  console.log(`Review Roulette server is listening on port ${config.port}!`)
);
*/
