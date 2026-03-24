// Event listener for the transaction form
document.getElementById('transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent form submission

    // Get values from the form
    const accountNo = document.getElementById('accountNo').value;
    const transactionDetails = document.getElementById('transactionDetails').value;
    const chqNo = document.getElementById('chqNo').value;
    const valueDate = document.getElementById('valueDate').value;
    const withdrawalAmt = document.getElementById('withdrawalAmt').value;
    const depositAmt = document.getElementById('depositAmt').value;

    // Create transaction object
    const transaction = {
        accountNo,
        transactionDetails,
        chqNo,
        valueDate,
        withdrawalAmt: parseFloat(withdrawalAmt),
        depositAmt: parseFloat(depositAmt)
    };

    // Send the transaction to the server
    const response = await fetch('/add-transaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
    });

    const result = await response.json();
    alert(result.message); // Show result to the user

    // Update transaction history
    fetchTransactionHistory();
});

// Function to fetch and display transaction history
async function fetchTransactionHistory() {
    const response = await fetch('/transaction-history');
    const history = await response.json();
    document.getElementById('transaction-history').innerText = JSON.stringify(history, null, 2);
}

// Initial fetch of transaction history
fetchTransactionHistory();
