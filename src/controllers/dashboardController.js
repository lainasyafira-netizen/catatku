const dashboardService = require('../services/dashboardService');

exports.getIndex = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const data = await dashboardService.getDashboardData(userId);

    res.render('dashboard', {
      title: 'CatatKu - Dashboard',
      currentBalance: data.currentBalance,
      monthIncome: data.monthIncome,
      monthExpense: data.monthExpense,
      chartLabels: JSON.stringify(data.chartLabels),
      chartData: JSON.stringify(data.chartData),
      budgetAlerts: data.budgetAlerts,
    });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).send('Terjadi kesalahan memuat dashboard.');
  }
};
