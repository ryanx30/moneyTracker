document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const form = document.getElementById("transactionForm");
  const categorySelect = document.getElementById("category");
  const recentTransactionsList = document.getElementById("recentTransactions");
  const netWorthElement = document.getElementById("net-worth");
  const accountList = document.getElementById("accountList");

  const tabs = document.querySelectorAll("#transactionTabs .nav-link"); // Tabs (expense, transfer, income)

  // Initialize transactions, net worth, and accounts
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  let accounts = JSON.parse(localStorage.getItem("accounts")) || {
    cash: 0,
    debit: 0,
  };
  let netWorth = calculateNetWorth(accounts);

  // Categories for each type
  const categories = {
    expense: [
      "Groceries",
      "Food",
      "Rent",
      "Income tax",
      "Shopping",
      "Utilities",
      "Hobby",
      "Vacation",
      "Others",
    ],
    income: ["Salary", "Bonus", "Others"],
    transfer: ["Cash to Debit", "Debit to Cash"],
  };

  // Function to calculate net worth based on account balances
  function calculateNetWorth(accounts) {
    return Object.values(accounts).reduce((total, balance) => total + balance, 0);
  }

  // Update net worth display
  function updateNetWorth() {
    netWorth = calculateNetWorth(accounts);
    netWorthElement.textContent = `Rp ${netWorth.toLocaleString()}`;
  }

  // Update category options based on selected tab
  function updateCategoryOptions(type) {
    categorySelect.innerHTML = ""; // Clear existing options
    const availableCategories = categories[type] || [];
    availableCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.toLowerCase().replace(/\s+/g, "-");
      option.textContent = category;
      categorySelect.appendChild(option);
    });
  }

  // Switch active tab
  function switchTab(tab) {
    const tabs = document.querySelectorAll("#transactionTabs .nav-link");

    tabs.forEach((t) => t.classList.remove("active"));

    const activeTab = document.querySelector(`#${tab}-tab`);
    if (activeTab) {
      activeTab.classList.add("active");
    } else {
      console.error(`Tab with ID #${tab}-tab not found.`);
      return;
    }

    updateCategoryOptions(tab);
    form.type.value = tab;
  }

  document.querySelectorAll("#transactionTabs .nav-link").forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      const tabType = tab.id.replace("-tab", "");
      switchTab(tabType);
    });
  });

  // Add a new transaction
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const type = form.type.value;
    const amount = parseFloat(form.amount.value);
    const category = form.category.value;
    const date = form.date.value || new Date().toISOString();
    const account = form.account.value;

    if (!type || isNaN(amount) || amount <= 0 || !category) {
      alert("Please fill out all fields correctly.");
      return;
    }

    if (type === "transfer") {
      const targetAccount = account === "cash" ? "debit" : "cash";

      if (accounts[account] < amount) {
        alert(`Insufficient balance in ${account.toUpperCase()} for transfer.`);
        return;
      }

      accounts[account] -= amount;
      accounts[targetAccount] += amount;

      const newTransaction = {
        id: Date.now(),
        type,
        amount,
        category,
        date,
        account,
        targetAccount,
      };

      transactions.push(newTransaction);
      localStorage.setItem("transactions", JSON.stringify(transactions));
      localStorage.setItem("accounts", JSON.stringify(accounts));

      updateNetWorth();
      renderRecentTransactions();
      renderAccounts();
      form.reset();
      updateCategoryOptions(type);
      return;
    }

    if (type === "expense" && accounts[account] < amount) {
      alert(`Insufficient balance in ${account.toUpperCase()}`);
      return;
    }

    const newTransaction = {
      id: Date.now(),
      type,
      amount,
      category,
      date,
      account,
    };

    if (type === "income") {
      accounts[account] += amount;
    } else if (type === "expense") {
      accounts[account] -= amount;
    }

    transactions.push(newTransaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("accounts", JSON.stringify(accounts));

    updateNetWorth();
    renderRecentTransactions();
    renderAccounts();
    form.reset();
    updateCategoryOptions(type);
  });

  function renderRecentTransactions() {
    recentTransactionsList.innerHTML = "";

    if (transactions.length === 0) {
      const noTransaction = document.createElement("li");
      noTransaction.className = "list-group-item text-center";
      noTransaction.textContent = "No recent transactions.";
      recentTransactionsList.appendChild(noTransaction);
      return;
    }

    const recentTransactions = transactions.slice(-3).reverse();
    recentTransactions.forEach(
      ({ type, category, amount, date, account, targetAccount }) => {
        const li = document.createElement("li");
        li.className =
          "list-group-item d-flex justify-content-between align-items-center";

        const transactionDate = new Date(date).toLocaleDateString();
        const amountClass =
          type === "income" ? "text-success" : type === "expense" ? "text-danger" : "text-info";

        li.innerHTML = `
          <div>
            <strong>${
              type === "transfer"
                ? `${account.toUpperCase()} → ${targetAccount.toUpperCase()}`
                : category
            }</strong>
            <p class="mb-0 text-muted small">${transactionDate}</p>
          </div>
          <span class="${amountClass}">Rp ${amount.toLocaleString()}</span>
        `;
        recentTransactionsList.appendChild(li);
      }
    );
  }

  function renderAccounts() {
    accountList.innerHTML = "";

    for (const [account, balance] of Object.entries(accounts)) {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <span>${account.charAt(0).toUpperCase() + account.slice(1)}</span>
        <span>Rp ${balance.toLocaleString()}</span>
      `;
      accountList.appendChild(li);
    }

    if (Object.keys(accounts).length === 0) {
      const noAccount = document.createElement("li");
      noAccount.className = "list-group-item text-center";
      noAccount.textContent = "No accounts available.";
      accountList.appendChild(noAccount);
    }
  }

  updateNetWorth();
  updateCategoryOptions("expense");
  renderRecentTransactions();
  renderAccounts();
  switchTab("expense");

  document.getElementById("resetButton").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all data?")) {
      localStorage.clear();
      alert("Data has been reset!");
      location.reload();
    }
  });
});
