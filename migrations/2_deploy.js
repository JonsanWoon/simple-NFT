// migrations/2_deploy.js
// SPDX-License-Identifier: MIT
const testNFT = artifacts.require("testNFT");

module.exports = function(deployer) {
  deployer.deploy(testNFT, "TEST NFT", "TNFT");
};