const reportService = require('../services/reportService');

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

    const data = await reportService.getReportData({
      userId,
      filterMonth,
      filterYear,
      startDateQuery,
      endDateQuery,
      categoryIdQuery
    });

    res.render('reports/index', {
      title: 'CatatKu - Laporan',
      categories: data.categories,
      currentMonth: filterMonth,
      currentYear: filterYear,
      startDate: startDateQuery || '',
      endDate: endDateQuery || '',
      selectedCategory: categoryIdQuery || 'ALL',
      // Chart JSONs
      trendLabels: JSON.stringify(data.trendLabels),
      incomeData: JSON.stringify(data.incomeData),
      expenseData: JSON.stringify(data.expenseData),
      pieLabels: JSON.stringify(data.pieLabels),
      pieData: JSON.stringify(data.pieData),
      // History
      historyTransactions: data.historyTransactions,
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).send('Terjadi kesalahan memuat laporan.');
  }
};
