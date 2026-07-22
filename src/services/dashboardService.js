const prisma = require('../lib/prisma');

class DashboardService {
  async getDashboardData(userId) {
    // 1. Calculate all-time totals for Balance
    const allTransactions = await prisma.transaction.findMany({
      where: { userId },
      select: { type: true, amount: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    allTransactions.forEach(t => {
      if (t.type === 'INCOME') totalIncome += t.amount;
      if (t.type === 'EXPENSE') totalExpense += t.amount;
    });

    const currentBalance = totalIncome - totalExpense;

    // 2. Calculate current month's Income, Expense, and Category breakdown
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 1);

    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
      include: { category: true },
    });

    let monthIncome = 0;
    let monthExpense = 0;
    const expenseByCategory = {};

    monthTransactions.forEach(t => {
      if (t.type === 'INCOME') {
        monthIncome += t.amount;
      }
      if (t.type === 'EXPENSE') {
        monthExpense += t.amount;
        const catName = t.category.name;
        if (!expenseByCategory[catName]) {
          expenseByCategory[catName] = 0;
        }
        expenseByCategory[catName] += t.amount;
      }
    });

    const chartLabels = Object.keys(expenseByCategory);
    const chartData = Object.values(expenseByCategory);

    // 3. Fetch budgets and calculate alerts for > 80% usage
    const budgets = await prisma.budget.findMany({
      where: { userId, month: currentMonth, year: currentYear },
      include: { category: true },
    });

    const spentByCategoryId = {};
    monthTransactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        if (!spentByCategoryId[t.categoryId]) {
          spentByCategoryId[t.categoryId] = 0;
        }
        spentByCategoryId[t.categoryId] += t.amount;
      }
    });

    const budgetAlerts = [];
    budgets.forEach(b => {
      const spent = spentByCategoryId[b.categoryId] || 0;
      const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      
      if (progress >= 100) {
        budgetAlerts.push({
          type: 'danger',
          message: `Anggaran "${b.category.name}" telah terlampaui (Terpakai ${progress.toFixed(1)}%).`,
        });
      } else if (progress >= 80) {
        budgetAlerts.push({
          type: 'warning',
          message: `Anggaran "${b.category.name}" hampir habis (Terpakai ${progress.toFixed(1)}%).`,
        });
      }
    });

    return {
      currentBalance,
      monthIncome,
      monthExpense,
      chartLabels,
      chartData,
      budgetAlerts,
    };
  }
}

module.exports = new DashboardService();
