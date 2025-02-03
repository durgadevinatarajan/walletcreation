const mongoose = require('mongoose');
const glob = require('glob');
const autoIncrement = require('mongoose-auto-increment');
const softDeletePlugin = require("delete-soft-mongoose");
require('dotenv').config();

const switchDB = async (dbName) => {

  const db = mongoose.connection.useDb(dbName, { useNewUrlParser: true, useUnifiedTopology: true });
  autoIncrement.initialize(mongoose.connection);
 
  mongoose.plugin(softDeletePlugin);
  const models = glob.sync(__dirname + '/../model/tenant/*.js');
  models.forEach((model) => {
    const modelName = model.split("/").pop().replace(".js", "");
    const schema = require("../model/tenant/" + modelName);
    db.model(modelName, schema);
  });

  return db;
}

module.exports = { switchDB };
