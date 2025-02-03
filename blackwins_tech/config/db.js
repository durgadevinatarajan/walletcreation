require('dotenv').config();
const express = require('express');
const connectDB = require('./db'); 
const { createWallet } = require('./wallet');

const app = express();
app.use(express.json());

//Wallet creation
app.post('/wallet/create', async (req, res) => {
  try {
    const wallet = await createWallet();
    res.json({
      publicAddress: wallet.publicAddress,
      createdAt: wallet.createdAt,
      message: 'Wallet created successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create wallet', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
