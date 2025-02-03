const express = require("express");
const router = express.Router();
const walletController = require("./controller/wallet");

router.post("/wallet/create", walletController.createWallet);
router.get("/wallet/:address", walletController.getWallet);
router.post("/transaction/send", walletController.sendTransaction);
router.get("/transaction/:txId", walletController.getTransaction);
router.get("/transactions/:address", walletController.getTransactionsForWallet);

module.exports = router;
