const prisma = require('../lib/prisma');

exports.getReports = async (req, res) => {
  try {
    const userId = req.session.userId;
    const now = new Date();
    
    // --- Parse Query Params ---
    const filterMonth = parseInt(req.query.month) || now.getMonth() + 1;
    const filterYear = parseInt(req.query.year) || now.getFullYear();
    const startDateQuery = req.query.startDate;
    const endDateQuery = req.query.endDate;
    const categoryIdQuery = req.query.categoryId;

    // --- 1. Bar Chart Data (Last 6 Months Trend) ---
    // Calculate the start of the 6-month period
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const trendTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: sixMonthsAgo,
          lt: firstDayOfNextMonth,
        },
      },
    });

    // Initialize 6 months buckets
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

    // Extract sorted labels and data arrays
    const trendLabels = Object.keys(trendData).sort((a, b) => trendData[a].sortKey - trendData[b].sortKey);
    const incomeData = trendLabels.map(l => trendData[l].income);
    const expenseData = trendLabels.map(l => trendData[l].expense);

    // --- 2. Pie Chart Data (Expense per Category for Selected Month) ---
    const startOfSelectedMonth = new Date(filterYear, filterMonth - 1, 1);
    const startOfNextMonth = new Date(filterYear, filterMonth, 1);

    const monthExpenseTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: startOfSelectedMonth,
          lt: startOfNextMonth,
        },
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
      // Set to end of day
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
      take: 200, // Limit to prevent massive loads
    });

    // Fetch all categories for the filter dropdown
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    res.render('reports/index', {
      title: 'CatatKu - Laporan',
      categories,
      currentMonth: filterMonth,
      currentYear: filterYear,
      startDate: startDateQuery || '',
      endDate: endDateQuery || '',
      selectedCategory: categoryIdQuery || 'ALL',
      // Chart JSONs
      trendLabels: JSON.stringify(trendLabels),
      incomeData: JSON.stringify(incomeData),
      expenseData: JSON.stringify(expenseData),
      pieLabels: JSON.stringify(pieLabels),
      pieData: JSON.stringify(pieData),
      // History
      historyTransactions,
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).send('Terjadi kesalahan memuat laporan.');
  }
};
