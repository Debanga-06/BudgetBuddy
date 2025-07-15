
let expenses = [];
let currentCurrency = 'INR';
let monthlyBudget = 0;
let savingsGoal = 0;
let categoryChart = null;
let monthlyChart = null;

const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateUI();
    setCurrentDate();
    initializeCharts();
});

function loadData() {
    const savedExpenses = JSON.parse(localStorage.getItem('budgetBuddy_expenses') || '[]');
    const savedCurrency = localStorage.getItem('budgetBuddy_currency') || 'INR';
    const savedBudget = parseFloat(localStorage.getItem('budgetBuddy_budget') || '0');
    const savedSavings = parseFloat(localStorage.getItem('budgetBuddy_savings') || '0');
    const savedTheme = localStorage.getItem('budgetBuddy_theme') || 'light';

    expenses = savedExpenses;
    currentCurrency = savedCurrency;
    monthlyBudget = savedBudget;
    savingsGoal = savedSavings;

    document.getElementById('currencySelect').value = currentCurrency;
    document.getElementById('budgetAmount').value = monthlyBudget;
    document.getElementById('savingsAmount').value = savingsGoal;

    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.querySelector('.theme-toggle i').className = 'fas fa-sun';
    }
}

function saveData() {
    localStorage.setItem('budgetBuddy_expenses', JSON.stringify(expenses));
    localStorage.setItem('budgetBuddy_currency', currentCurrency);
    localStorage.setItem('budgetBuddy_budget', monthlyBudget.toString());
    localStorage.setItem('budgetBuddy_savings', savingsGoal.toString());
}

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

function formatCurrency(amount) {
    const symbol = currencySymbols[currentCurrency];
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
}

function updateCurrency() {
    currentCurrency = document.getElementById('currencySelect').value;
    saveData();
    updateUI();
}

function updateBudget() {
    monthlyBudget = parseFloat(document.getElementById('budgetAmount').value || 0);
    savingsGoal = parseFloat(document.getElementById('savingsAmount').value || 0);
    saveData();
    updateUI();
}

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-toggle i');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('budgetBuddy_theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('budgetBuddy_theme', 'dark');
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'charts') {
        setTimeout(() => {
            updateCharts();
        }, 100);
    }
}

// Form submission
document.getElementById('expenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    
    const expense = {
        id: Date.now(),
        amount: amount,
        category: category,
        date: date,
        description: description,
        timestamp: new Date().toISOString()
    };
    
    expenses.push(expense);
    saveData();
    updateUI();
    
    // Reset form
    document.getElementById('expenseForm').reset();
    setCurrentDate();
});

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveData();
        updateUI();
    }
}

function updateUI() {
    updateStats();
    updateBudgetProgress();
    displayExpenses();
    updateCharts();
}

function updateStats() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    document.getElementById('totalExpenses').textContent = formatCurrency(total);
    document.getElementById('monthlyBudget').textContent = formatCurrency(monthlyBudget);
    document.getElementById('savingsGoal').textContent = formatCurrency(savingsGoal);
}

function updateBudgetProgress() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const percentage = monthlyBudget > 0 ? Math.min((monthlyTotal / monthlyBudget) * 100, 100) : 0;
    const remaining = Math.max(monthlyBudget - monthlyTotal, 0);
    
    document.getElementById('budgetProgress').style.width = percentage + '%';
    document.getElementById('spentAmount').textContent = `Spent: ${formatCurrency(monthlyTotal)}`;
    document.getElementById('remainingAmount').textContent = `Remaining: ${formatCurrency(remaining)}`;
    
    // Change color based on percentage
    const progressFill = document.getElementById('budgetProgress');
    if (percentage > 80) {
        progressFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    } else if (percentage > 60) {
        progressFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
    } else {
        progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
    }
}

function displayExpenses() {
    const expensesList = document.getElementById('expensesList');
    const filteredExpenses = getFilteredExpenses();
    
    if (filteredExpenses.length === 0) {
        expensesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>No expenses found</h3>
                <p>Add your first expense to get started!</p>
            </div>
        `;
        return;
    }
    
    expensesList.innerHTML = filteredExpenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(expense => `
            <div class="expense-item">
                <div class="expense-details">
                    <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                    <div class="expense-category">${getCategoryIcon(expense.category)} ${getCategoryName(expense.category)}</div>
                    <div class="expense-date">${formatDate(expense.date)}</div>
                    ${expense.description ? `<div class="expense-description">${expense.description}</div>` : ''}
                </div>
                <div class="expense-actions">
                    <button onclick="deleteExpense(${expense.id})" class="btn btn-danger btn-sm" type="button">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
}

function getFilteredExpenses() {
    const periodFilter = document.getElementById('periodFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filtered = expenses;
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(expense => expense.category === categoryFilter);
    }
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    switch (periodFilter) {
        case 'today':
            filtered = filtered.filter(expense => new Date(expense.date) >= startOfDay);
            break;
        case 'week':
            filtered = filtered.filter(expense => new Date(expense.date) >= startOfWeek);
            break;
        case 'month':
            filtered = filtered.filter(expense => new Date(expense.date) >= startOfMonth);
            break;
        case 'custom':
            const fromDate = document.getElementById('fromDate').value;
            const toDate = document.getElementById('toDate').value;
            if (fromDate && toDate) {
                filtered = filtered.filter(expense => {
                    const expenseDate = new Date(expense.date);
                    return expenseDate >= new Date(fromDate) && expenseDate <= new Date(toDate);
                });
            }
            break;
    }
    
    return filtered;
}

function filterExpenses() {
    const periodFilter = document.getElementById('periodFilter').value;
    const customDateRange = document.getElementById('customDateRange');
    
    if (periodFilter === 'custom') {
        customDateRange.style.display = 'block';
    } else {
        customDateRange.style.display = 'none';
    }
    
    displayExpenses();
}

function getCategoryIcon(category) {
    const icons = {
        food: '🍽️',
        transport: '🚗',
        shopping: '🛍️',
        entertainment: '🎬',
        bills: '📋',
        healthcare: '🏥',
        education: '📚',
        travel: '✈️',
        other: '📦'
    };
    return icons[category] || '📦';
}

function getCategoryName(category) {
    const names = {
        food: 'Food & Dining',
        transport: 'Transportation',
        shopping: 'Shopping',
        entertainment: 'Entertainment',
        bills: 'Bills & Utilities',
        healthcare: 'Healthcare',
        education: 'Education',
        travel: 'Travel',
        other: 'Other'
    };
    return names[category] || 'Other';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function initializeCharts() {
    const ctx1 = document.getElementById('categoryChart').getContext('2d');
    const ctx2 = document.getElementById('monthlyChart').getContext('2d');

    categoryChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#6366f1',
                    '#8b5cf6',
                    '#ec4899',
                    '#f59e0b',
                    '#10b981',
                    '#3b82f6',
                    '#ef4444',
                    '#84cc16',
                    '#6b7280'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Expenses by Category'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    monthlyChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Expenses',
                data: [],
                backgroundColor: '#6366f1',
                borderColor: '#4338ca',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Spending Trend'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateCharts() {
    if (!categoryChart || !monthlyChart) return;

    const categoryData = {};
    expenses.forEach(expense => {
        const categoryName = getCategoryName(expense.category);
        categoryData[categoryName] = (categoryData[categoryName] || 0) + expense.amount;
    });

    categoryChart.data.labels = Object.keys(categoryData);
    categoryChart.data.datasets[0].data = Object.values(categoryData);
    categoryChart.update();

    const monthlyData = {};
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.amount;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const monthLabels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    monthlyChart.data.labels = monthLabels;
    monthlyChart.data.datasets[0].data = sortedMonths.map(month => monthlyData[month]);
    monthlyChart.update();
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('BudgetBuddy - Expense Report', 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    doc.setFontSize(14);
    doc.text('Summary:', 20, 50);
    doc.setFontSize(12);
    doc.text(`Total Expenses: ${formatCurrency(total)}`, 20, 60);
    doc.text(`Monthly Budget: ${formatCurrency(monthlyBudget)}`, 20, 70);
    doc.text(`Savings Goal: ${formatCurrency(savingsGoal)}`, 20, 80);

    const categoryData = {};
    expenses.forEach(expense => {
        const categoryName = getCategoryName(expense.category);
        categoryData[categoryName] = (categoryData[categoryName] || 0) + expense.amount;
    });

    doc.setFontSize(14);
    doc.text('Expenses by Category:', 20, 100);
    doc.setFontSize(12);
    let yPos = 110;
    Object.entries(categoryData).forEach(([category, amount]) => {
        doc.text(`${category}: ${formatCurrency(amount)}`, 20, yPos);
        yPos += 10;
    });

    // Recent Expenses
    doc.setFontSize(14);
    doc.text('Recent Expenses:', 20, yPos + 10);
    yPos += 20;
    doc.setFontSize(12);

    const recentExpenses = expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    recentExpenses.forEach(expense => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        const line = `${formatDate(expense.date)} - ${getCategoryName(expense.category)} - ${formatCurrency(expense.amount)}`;
        doc.text(line, 20, yPos);
        if (expense.description) {
            yPos += 10;
            doc.text(`  ${expense.description}`, 20, yPos);
        }
        yPos += 10;
    });

    doc.save('budget-buddy-report.pdf');
}