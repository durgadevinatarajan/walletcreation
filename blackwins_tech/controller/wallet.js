const { switchDB } = require("../../config/switchdb");
const { ObjectId } = require('mongoose');
const crypto = require('crypto');
const { ec: EC } = require('elliptic');
const { switchDB } = require("../config/switchdb");
require('dotenv').config();

const ec = new EC('secp256k1');

const _createWallet = async (req, res) => {
  try {
    let db = await switchDB(req.headers.dbname);
    let Wallet = db.model("Wallet");

    // Generate key Pair
    const keyPair = ec.genKeyPair();
    const publicAddress = keyPair.getPublic("hex");
    const privateKey = keyPair.getPrivate("hex");

    // Encrypt the private key using AES-256-CBC
    const encryptionSecret = process.env.ENCRYPTION_SECRET;
    const cipher = crypto.createCipher("aes-256-cbc", encryptionSecret);
    let encryptedPrivateKey = cipher.update(privateKey, "utf8", "hex");
    encryptedPrivateKey += cipher.final("hex");

    // Create the wallet document
    const walletData = {
      publicAddress,
      privateKey: encryptedPrivateKey,
      createdAt: new Date()
    };

    const existingWallet = await Wallet.findOne({ publicAddress });
    if (existingWallet) {
      return res.status(400).json({ error: "Wallet already exists" });
    }

    let wallet = await Wallet.create(walletData);
    return res.status(200).json({ publicAddress, privateKey });
  } catch (error) {
    console.error("Error creating wallet:", error);
    return res.status(500).json({ error: error.message });
  }
};

const _getWallet = async (req, res) => {
  try {
    let db = await switchDB(req.headers.dbname);
    let Wallet = db.model("Wallet");
    let Transaction = db.model("Transaction");

    let wallet = await Wallet.findOne({ publicAddress: req.params.address });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Simulate balance calculation from confirmed transactions.
    const sentTxs = await Transaction.find({ sender: wallet.publicAddress, status: "Confirmed" });
    const receivedTxs = await Transaction.find({ receiver: wallet.publicAddress, status: "Confirmed" });
    const sentTotal = sentTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const receivedTotal = receivedTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const balance = receivedTotal - sentTotal;

    return res.status(200).json({
      publicAddress: wallet.publicAddress,
      balance,
      createdAt: wallet.createdAt
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return res.status(500).json({ error: error.message });
  }
};

const _sendTransaction = async (req, res) => {
  try {
    const { sender, receiver, amount } = req.body;
    if (!sender || !receiver || !amount) {
      return res.status(400).json({ error: "Sender, receiver, and amount are required" });
    }

    let db = await switchDB(req.headers.dbname);
    let Wallet = db.model("Wallet");
    let Transaction = db.model("Transaction");

    // Verify sender wallet exists
    const senderWallet = await Wallet.findOne({ publicAddress: sender });
    if (!senderWallet) {
      return res.status(404).json({ error: "Sender wallet not found" });
    }

    // Calculate sender balance
    const sentTxs = await Transaction.find({ sender, status: "Confirmed" });
    const receivedTxs = await Transaction.find({ receiver: sender, status: "Confirmed" });
    const sentTotal = sentTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const receivedTotal = receivedTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const balance = receivedTotal - sentTotal;

    if (balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // Create a new transaction record
    const transactionId = crypto.randomBytes(16).toString("hex");
    const txData = {
      transactionId,
      sender,
      receiver,
      amount,
      status: "Confirmed", 
      timestamp: new Date()
    };

    let transaction = await Transaction.create(txData);
    return res.status(200).json({
      transactionId: transaction.transactionId,
      sender: transaction.sender,
      receiver: transaction.receiver,
      amount: transaction.amount,
      timestamp: transaction.timestamp
    });
  } catch (error) {
    console.error("Error sending transaction:", error);
    return res.status(500).json({ error: error.message });
  }
};

const _getTransaction = async (req, res) => {
  try {
    let db = await switchDB(req.headers.dbname);
    let Transaction = db.model("Transaction");

    let transaction = await Transaction.findOne({ transactionId: req.params.txId });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.status(200).json({ transactionId: transaction.transactionId, sender: transaction.sender, receiver: transaction.receiver, amount: transaction.amount, status: transaction.status, timestamp: transaction.timestamp });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return res.status(500).json({ error:  error.message });
  }
};

const _getTransactionsForWallet = async (req, res) => {
  try {
    let db = await switchDB(req.headers.dbname);
    let Transaction = db.model("Transaction");

    const transactions = await Transaction.find({
      $or: [{ sender: req.params.address }, { receiver: req.params.address }]
    }).sort({ timestamp: -1 });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ error: "Error fetching transactions", details: error.message });
  }
};

module.exports = {
  post: _createWallet,
  get: _getWallet,
  sendTransaction: _sendTransaction,
  getTransaction: _getTransaction,
  getTransactionsForWallet: _getTransactionsForWallet
};
