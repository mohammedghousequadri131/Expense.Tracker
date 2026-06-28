document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const incomeEl = document.getElementById('income');
    const expenseEl = document.getElementById('expense');
    const balanceEl = document.getElementById('balance');
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const notificationText = document.getElementById('notification-text');
    const budgetLimitsForm = document.getElementById('budget-limits-form');

    // --- State ---
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let manualIncome = JSON.parse(localStorage.getItem('manualIncome')) || null;
    let budgetLimits = JSON.parse(localStorage.getItem('budgetLimits')) || {
        Food: 500,
        Travel: 100,
        Rent: 1500,
        "College Fee": 200,
        Shopping: 300
    };

    /**
     * Updates the summary cards (Income, Expense, Balance)
     */
    const updateSummary = () => {
        const amounts = transactions.map(t => t.amount);
        let income;
        if (manualIncome !== null) {
            income = manualIncome.toFixed(2);
        } else {
            income = amounts
                .filter(item => item > 0)
                .reduce((acc, item) => (acc += item), 0)
                .toFixed(2);
        }

        const expense = (
            amounts
                .filter(item => item < 0)
                .reduce((acc, item) => (acc += item), 0) * -1
        ).toFixed(2);

        const balance = (income - expense).toFixed(2);

        incomeEl.textContent = `₹${income}`;
        expenseEl.textContent = `₹${expense}`;
        balanceEl.textContent = `₹${balance}`;
    };

    /**
     * Adds a transaction to the DOM
     * @param {object} transaction - The transaction object
     */
    const addTransactionToDOM = (transaction) => {
        const { id, description, date, category, amount } = transaction;
        const sign = amount < 0 ? '' : '+';
        const item = document.createElement('tr');

        item.innerHTML = `
            <td>${description}</td>
            <td>${date}</td>
            <td>${category}</td>
            <td>${sign}₹${Math.abs(amount).toFixed(2)}</td>
            <td><button class="delete-btn" onclick="removeTransaction(${id})">Remove</button></td>
        `;

        transactionList.appendChild(item);
    };

    /**
     * Checks if any budget has been exceeded and displays a notification
     */
    const checkBudget = () => {
        notificationText.innerHTML = ''; // Clear previous notifications
        const expensesByCategory = transactions
            .filter(t => t.amount < 0 && t.category !== 'Income')
            .reduce((acc, transaction) => {
                acc[transaction.category] = (acc[transaction.category] || 0) + Math.abs(transaction.amount);
                return acc;
            }, {});

        for (const category in expensesByCategory) {
            if (budgetLimits[category] && expensesByCategory[category] > budgetLimits[category]) {
                // Calculate the exact amount the budget was exceeded by
                const exceededAmount = expensesByCategory[category] - budgetLimits[category];

                const p = document.createElement('p');
                p.innerHTML = `Warning: You have exceeded the <strong>${category}</strong> budget by ₹${exceededAmount.toFixed(2)}`;
                notificationText.appendChild(p);
            }
        }

        // If no notifications were added, show a default message
        if (notificationText.children.length === 0) {
            notificationText.innerHTML = '<p>No notifications</p>';
        }
    };
    
    /**
     * Displays the predefined budget limits
     */
    const displayBudgetLimits = () => {
        const formContent = Object.keys(budgetLimits).map(category => `
            <div class="limit-item">
                <label for="limit-${category}">${category}</label>
                <input type="number" id="limit-${category}" value="${budgetLimits[category]}" step="1">
            </div>
        `).join('');
        
        const button = budgetLimitsForm.querySelector('button');
        budgetLimitsForm.innerHTML = formContent;
        budgetLimitsForm.appendChild(button);
    }

    const handleLimitsUpdate = (e) => {
        e.preventDefault();
        const newLimits = {};
        for (const category in budgetLimits) {
            const input = document.getElementById(`limit-${category}`);
            newLimits[category] = parseFloat(input.value) || 0;
        }
        budgetLimits = newLimits;
        updateLocalStorage();
        init();
        alert('Budget limits updated!');
    }

    /**
     * Handles the form submission to add a new transaction
     * @param {Event} e - The submit event
     */
    const handleFormSubmit = (e) => {
        e.preventDefault();

        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;
        let amount = parseFloat(document.getElementById('amount').value);

        if (description.trim() === '' || date.trim() === '' || category.trim() === '' || isNaN(amount)) {
            alert('Please fill in all fields correctly.');
            return;
        }

        // Make amount negative for expense categories
        if (category !== 'Income') {
            amount = -Math.abs(amount);
        }

        const transaction = {
            id: generateID(),
            description,
            date,
            category,
            amount
        };

        transactions.push(transaction);
        updateLocalStorage();
        init();
        transactionForm.reset();
        document.getElementById('category').selectedIndex = 0; // Reset dropdown
    };

    /**
     * Removes a transaction by its ID
     * @param {number} id - The ID of the transaction to remove
     */
    window.removeTransaction = (id) => {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateLocalStorage();
        init();
    };
    
    /**
     * Generates a random ID
     */
    const generateID = () => {
        return Math.floor(Math.random() * 1000000000);
    }

    /**
     * Updates local storage with the current transactions and limits
     */
    const updateLocalStorage = () => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('manualIncome', JSON.stringify(manualIncome));
        localStorage.setItem('budgetLimits', JSON.stringify(budgetLimits));
    }


    /**
     * Initializes the application
     */
    const init = () => {
        transactionList.innerHTML = '';
        transactions.forEach(addTransactionToDOM);
        updateSummary();
        checkBudget();
        displayBudgetLimits();
    };

    /**
     * Handles the blur event on the editable income field.
     */
    const handleIncomeEdit = () => {
        // 1. Sanitize: Remove currency symbols, letters, and extra spaces.
        const sanitizedValue = incomeEl.innerText.replace(/[^0-9.]/g, '');
        
        // 2. Parse and validate, defaulting to 0.
        let newIncome = parseFloat(sanitizedValue);
        if (isNaN(newIncome)) {
            newIncome = 0;
        }
        
        // 3. Update state and re-render UI.
        manualIncome = newIncome;
        updateLocalStorage();
        updateSummary(); // This also handles re-formatting the text content.
    };

    // --- Event Listeners ---
    transactionForm.addEventListener('submit', handleFormSubmit);
    budgetLimitsForm.addEventListener('submit', handleLimitsUpdate);
    incomeEl.addEventListener('blur', handleIncomeEdit);
    // --- Initial Load ---
    init();
});