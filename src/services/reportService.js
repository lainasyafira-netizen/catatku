const prisma = require('../lib/prisma');

class ReportService {
  async getReportData({ userId, filterMonth, filterYear, startDateQuery, endDateQuery, categoryIdQuery }) {
    const now = new Date();

    // --- 1. Bar Chart Data (Last 6 Months Trend) ---
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const trendTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: sixMonthsAgo, lt: firstDayOfNextMonth },
      },
    });

    const trendData = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      trendData[key] = { income: 0, expense: 0, sortKey: d.getTime() };
    }

    trendTransactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (trendData[key]) {
        if (t.type === 'INCOME') trendData[key].income += t.amount;
        if (t.type === 'EXPENSE') trendData[key].expense += t.amount;
      }
    });

    const trendLabels = Object.keys(trendData).sort((a, b) => trendData[a].sortKey - trendData[b].sortKey);
    const incomeData = trendLabels.map(l => trendData[l].income);
    const expenseData = trendLabels.map(l => trendData[l].expense);

    // --- 2. Pie Chart Data ---
    const startOfSelectedMonth = new Date(filterYear, filterMonth - 1, 1);
    const startOfNextMonth = new Date(filterYear, filterMonth, 1);

    const monthExpenseTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfSelectedMonth, lt: startOfNextMonth },
      },
      include: { category: true },
    });

    const expenseByCategory = {};
    monthExpenseTransactions.forEach(t => {
      const catName = t.category.name;
      if (!expenseByCategory[catName]) {
        expenseByCategory[catName] = 0;
      }
      expenseByCategory[catName] += t.amount;
    });

    const pieLabels = Object.keys(expenseByCategory);
    const pieData = Object.values(expenseByCategory);

    // --- 3. Filtered Transaction History ---
    const historyWhere = { userId };
    
    if (startDateQuery) {
      historyWhere.date = { ...historyWhere.date, gte: new Date(startDateQuery) };
    }
    if (endDateQuery) {
      const endD = new Date(endDateQuery);
      endD.setHours(23, 59, 59, 999);
      historyWhere.date = { ...historyWhere.date, lte: endD };
    }
    if (categoryIdQuery && categoryIdQuery !== 'ALL') {
      historyWhere.categoryId = parseInt(categoryIdQuery);
    }

    const historyTransactions = await prisma.transaction.findMany({
      where: historyWhere,
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 200,
    });

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return {
      trendLabels,
      incomeData,
      expenseData,
      pieLabels,
      pieData,
      historyTransactions,
      categories,
    };
  }
}

module.exports = new ReportService();
