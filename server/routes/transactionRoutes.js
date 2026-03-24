const express = require('express');
const Blockchain = require('../blockchain');
const router = express.Router();
const blockchain = new Blockchain();

// Mock transaction handler
router.post('/make', (req, res) => {
  const { userId, transactionAmount } = req.body;
  
  // Create a block for the transaction
  const newBlock = {
    userId,
    transactionAmount,
    timestamp: new Date().toISOString()
  };

  blockchain.addBlock(newBlock);
  
  res.status(200).json({
    message: 'Transaction successful',
    block: newBlock,
    blockchain: blockchain.chain
  });
});

module.exports = router;
