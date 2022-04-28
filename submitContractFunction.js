var path = require('path');
const config = require('./config.js');
const winston = require('winston'); // library for create log file
let moment = require('moment'); // library for dine date time

const API_URL = config.FullHost; // "https://ropsten.infura.io/v3/9fd96f06b49e41fd9bec54f023ea49c5";
const PUBLIC_KEY = config.ownerAddress; // "0x5552B958005bd71012921cDD50ccBC0b55F7Afd2";
const PRIVATE_KEY = config.fromAddressPrivateKey // "3dca60a6c0eedeedf6b7a70bc58e9f426c04f41a08da590d66322d4ead41269d";

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(API_URL);
const contract = require("./"+config.projectName+".json");
const contractAddress = config.ContractAddress; // "0xFA81b62F9F58F7561D824541B0d21e30CaF8a12F";
const nftContract = new web3.eth.Contract(contract.abi, contractAddress);
const nftJsonURL = config.nftJsonURL;

var scriptName = path.basename(__filename, '.js');
var dirname = __dirname;

const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({
      filename: scriptName+'.log',
      dirname: dirname+'/log',
      zippedArchive: false,
    }),
  ]
});

async function mint(username, amount, jsonFileName) {
  const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'pending'); //get latest nonce
  //the transaction

  var mintData = {
    "Username": username, 
    "Income Cap": amount,
    "JSON URL": nftJsonURL+jsonFileName
  };
  logger.info("Mint token for username: "+username+" aum: "+amount+" url: "+nftJsonURL+jsonFileName+".");

  uri = JSON.stringify(mintData); // nftJsonURL+jsonFileName;
  var estimateGasAmount = 0;
  await nftContract.methods.mint(PUBLIC_KEY, uri).estimateGas({from: PUBLIC_KEY})
  .then(function(gasAmount){
      estimateGasAmount =  200000 + gasAmount; 
      logger.info("Estimate Gas Mint token :"+gasAmount+" Set gas limit: "+estimateGasAmount);
  })
  .catch(function(error){
      logger.info("Estimate Gas Error :"+error);
  });

  const tx = {
        'from': PUBLIC_KEY,
        'nonce': web3.utils.toHex(nonce),
        'to': contractAddress,
        'gas': web3.utils.toHex(estimateGasAmount),
        'data': nftContract.methods.mint(PUBLIC_KEY, uri).encodeABI()
    };

  try{
    const signPromise = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    let receipt = await web3.eth.sendSignedTransaction(signPromise.rawTransaction).catch(function (error) {
        logger.error(moment().format('YYYY-MM-DD HH:mm:ss')+" Error: "+error);
        var errMsg = error+" ";
        var result = { status: "error", code: "1", statusMsg: "Mint Failed", data: errMsg};        
        var returnJson = JSON.stringify(result);
        console.log(returnJson);
        process.exit(1);
    });

    var tInfo = receipt;
    logger.info(moment().format('YYYY-MM-DD HH:mm:ss')+" Receipt Data: "+ JSON.stringify(tInfo));
    var tokenID = parseInt(tInfo.logs[0].topics[3], 16);
    var result = { status: "ok", code: "1", statusMsg: "", data: { transaction_id: tInfo.logs[0].transactionHash, tokenID: tokenID } }
    var returnJson = JSON.stringify(result);

  } catch (e){
    var result = { status: "error", code: "1", statusMsg: "Mint Failed", data: JSON.stringify(e)};
    var returnJson = JSON.stringify(result);
    process.exit(1);
  }

  logger.info(moment().format('YYYY-MM-DD HH:mm:ss')+" Return Data: "+returnJson);
  console.log(returnJson);
  process.exit(1);
}

async function getStoredDataByTokenID(tokenID) {
    if(!tokenID){
      logger.error(moment().format('YYYY-MM-DD HH:mm:ss')+" Token ID not Found.");
      var returnRes = {status: "error", code: "1", statusMsg: "Token ID not Found", data: ""};
      console.log(JSON.stringify(returnRes));
      return;
    }  

    try{
      var storedData = await nftContract.methods.tokenURI(tokenID).call();  
      logger.info(moment().format('YYYY-MM-DD HH:mm:ss')+" "+storedData);
      var returnRes = {status: "ok", code: "1", statusMsg: "", data: JSON.parse(storedData)};
      console.log(JSON.stringify(returnRes));
    } catch(e){
      logger.error(moment().format('YYYY-MM-DD HH:mm:ss')+" Failed Get Token ID Data. "+e);
      var returnRes = {status: "error", code: "2", statusMsg: "Failed Get Token ID Data", data: e};
      console.log(JSON.stringify(returnRes));
    }
    process.exit(1);
}

async function burnTokenID(tokenID) {
    if(!tokenID){
      logger.error(moment().format('YYYY-MM-DD HH:mm:ss')+" Token ID not Found.");
      var returnRes = {status: "error", code: "1", statusMsg: "Token ID not Found", data: ""};
      console.log(JSON.stringify(returnRes));
      return;
    }  

    logger.info(moment().format('YYYY-MM-DD HH:mm:ss')+" Burn tokenID: "+tokenID);

    var estimateGasAmount = 0;
    await nftContract.methods.burn(tokenID).estimateGas({from: PUBLIC_KEY})
    .then(function(gasAmount){
        estimateGasAmount =  200000 + gasAmount; 
        logger.info("Estimate Gas Burn token :"+gasAmount+" Set gas limit: "+estimateGasAmount);
    })
    .catch(function(error){
        logger.info("Estimate Gas Error :"+error);
    });

    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'pending'); //get latest nonce
    const tx = {
        'from': PUBLIC_KEY,
        'nonce': web3.utils.toHex(nonce),
        'to': contractAddress,
        'gas': web3.utils.toHex(estimateGasAmount),
        'data': nftContract.methods.burn(tokenID).encodeABI()
    };

    try {
        // const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
        // await signPromise.then((signedTx) => {
        //     web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
        //         if (!err) {
        //           logger.info(moment().format('YYYY-MM-DD HH:mm:ss')+" The hash of your transaction is: "+hash); 
        //           var returnRes = {status: "ok", code: "1", statusMsg: "Success Burn Token", data: ""};
        //           console.log(JSON.stringify(returnRes));
        //         } else {
        //           logger.error(moment().format('YYYY-MM-DD HH:mm:ss')+" Something went wrong when submitting your transaction: "+err);
        //           var errMsg = err+" ";
        //           var returnRes = {status: "error", code: "1", statusMsg: "Failed Burn Token", data: errMsg};
        //           console.log(JSON.stringify(returnRes));
        //         }
        //     });

        // }).catch((err) => {
        //   logger.error(moment().format('YYYY-MM-DD HH:mm:ss')+" "+err);
        //   console.log("Promise failed:", err);
        // });


        const signPromise = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
        let receipt = await web3.eth.sendSignedTransaction(signPromise.rawTransaction).catch(function (error) {
            logger.error(moment().format('YYYY-MM-DD HH:mm:ss')+" Error: "+error);
            var errMsg = error+" ";
            var result = { status: "error", code: "1", statusMsg: "Failed Burn Token", data: errMsg};        
            var returnJson = JSON.stringify(result);
            console.log(returnJson);
            process.exit(1);
        });

        var tInfo = receipt;
        logger.info(moment().format('YYYY-MM-DD HH:mm:ss')+" The hash of your transaction is: "+tInfo.transactionHash);
        var returnRes = {status: "ok", code: "1", statusMsg: "Success Burn Token", data: ""};
        var returnJson = JSON.stringify(returnRes);

    } catch(e) {
      logger.error(moment().format('YYYY-MM-DD HH:mm:ss')+" Failed Burn Token.");
      var returnRes = {status: "error", code: "1", statusMsg: "Failed Burn Token", data: e};
      console.log(JSON.stringify(returnRes));
    }
    
    logger.info(moment().format('YYYY-MM-DD HH:mm:ss')+" Return Data: "+returnJson);
    console.log(returnJson);
    process.exit(1);
}

async function getGasPrice() {  
    var gasPrice =await web3.eth.getGasPrice();
    var result = { status: "ok", code: "1", statusMsg: "", data: { gasPrice: gasPrice }};
    var returnJson = JSON.stringify(result);
    console.log(JSON.stringify(result));
    process.exit(1);
}


var command = process.argv[2];
switch(command) {
  case 'mintToken':
    var username = process.argv[3];
    var amount = process.argv[4];
    var jsonFileName = process.argv[5];
    mint(username, amount, jsonFileName);
    break;

  case 'getTokenUri':
    var tokenID = process.argv[3];
    getStoredDataByTokenID(tokenID);
    break;

  case 'burnToken':
    var tokenID = process.argv[3];
    burnTokenID(tokenID);
    break;

  case 'gasPrice':
    getGasPrice();
    break;

  default:
    console.log('Invalid Command');
    process.exit(1);
}
