const fs = require('fs');
const crypto = require('crypto');
const csv = require('csv-parser');

// Block class for handling both user credentials and transactions
class Block {
  constructor(index, data, previousHash = '') {
    this.index = index;
    this.data = data; 
    this.previousHash = previousHash;
    this.timestamp = new Date(); 
    this.hash = this.calculateHash();
  }
  calculateHash() {
    return crypto.createHash('sha256').update(
      this.index + JSON.stringify(this.data) + this.previousHash + this.timestamp
    ).digest('hex');
  }
}





// Blockchain class to handle both credentials and transactions
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()]; // Initialize with Genesis block
  }

  createGenesisBlock() {
    return new Block(0, { type: 'Genesis Block' }, "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash; // Set the previous block's hash
    newBlock.hash = newBlock.calculateHash(); // Calculate new block's hash
    this.chain.push(newBlock); // Add block to the chain
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false; // Hash has been tampered with
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false; // Chain is broken
      }
    }
    return true;
  }
}

let bankBlockchain = new Blockchain();
let userCredentialsBlockchain = new Blockchain();

// Function to add user credentials to the blockchain
function addUserToBlockchain(accountNumber, username, pin, images, imageOrder) {
  const userBlockIndex = userCredentialsBlockchain.chain.length;

  // User data to be added to the blockchain
  const userData = {
    accountNumber,
    username,
    pin, // Hash the PIN in real implementation
    images,
    imageOrder
  };

  // Add a new block for the user credentials
  userCredentialsBlockchain.addBlock(new Block(userBlockIndex, userData));

  console.log(`User credentials for ${username} added to the blockchain.`);
  console.log(JSON.stringify(userCredentialsBlockchain, null, 4)); // View the blockchain for user credentials
  console.log('User Credentials Blockchain valid?', userCredentialsBlockchain.isChainValid()); // Validate user credentials blockchain
}

// Read the CSV and process transactions and credentials
fs.createReadStream('bank_transactions.csv')
  .pipe(csv())
  .on('data', (row) => {
    const {
      'Account No': accountNo,
      'WITHDRAWAL AMT': withdrawalAmt,
      'DEPOSIT AMT': depositAmt,
      'BALANCE AMT': balanceAmt,
      'USERNAME': username,
      'IMAGES': images,
      'IMAGE ORDER': imageOrder
    } = row;

    const blockIndex = bankBlockchain.chain.length;

    // Add a new block for both transactions and user credentials
    bankBlockchain.addBlock(new Block(
      blockIndex,
      { accountNo, withdrawalAmt, depositAmt, balanceAmt, username, images, imageOrder }
    ));
  })
  .on('end', () => {
    console.log(JSON.stringify(bankBlockchain, null, 4)); // View the blockchain for transactions
    console.log('Transaction Blockchain valid?', bankBlockchain.isChainValid()); // Validate transaction blockchain
  });

// Example usage: Adding a user during the signup process
addUserToBlockchain(
  '355326655943',
  'Swathy Sanjeev',
  '0812',
  [
    "C:\\Users\\swath\\Desktop\\Blockk\\server\\uploads\\img1.png",
    "C:\\Users\\swath\\Desktop\\Blockk\\server\\uploads\\img2.png",
    "C:\\Users\\swath\\Desktop\\Blockk\\server\\uploads\\img3.png"
  ],
  [0, 2, 1] // Example image order
);
