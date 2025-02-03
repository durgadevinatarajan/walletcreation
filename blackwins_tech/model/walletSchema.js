const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  publicAddress: { type: String, unique: true },
  privateKey: { type: String },
  createdAt: { type: Date, default: Date.now },
});

exports.walletSchema = walletSchema;
