const budgetService = require('../services/budgetService');

/**
 * Display all budgets for the logged-in user for a specific month and year
 */
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get month and year from query params, default to current month/year
    const currentQueryMonth = parseInt(req.query.month) || new Date().getMonth() + 1;
    const currentQueryYear = parseInt(req.query.year) || new Date().getFullYear();

    const { categories, budgetData, alerts } = await budgetService.getBudgetData({
      userId,
      month: currentQueryMonth,
      year: currentQueryYear
    });

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render('budgets/index', {
      title: 'CatatKu - Anggaran Bulanan',
      categories,
      budgetData,
      alerts,
      currentMonth: currentQueryMonth,
      currentYear: currentQueryYear,
      error,
      success,
    });
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).render('budgets/index', {
      title: 'CatatKu - Anggaran Bulanan',
      categories: [],
      budgetData: [],
      alerts: [],
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear(),
      error: 'Terjadi kesalahan pada server saat memuat anggaran.',
      success: null,
    });
  }
};

/**
 * Create or update a budget
 */
exports.saveBudget = async (req, res) => {
  const { categoryId, amount, month, year } = req.body;
  const userId = req.session.userId;

  try {
    const parsedCategoryId = parseInt(categoryId, 10);
    const parsedAmount = parseFloat(amount);
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedCategoryId) || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.redirect(`/budgets?month=${parsedMonth}&year=${parsedYear}&error=Input+tidak+valid.+Jumlah+harus+lebih+besar+dari+0.`);
    }

    if (parsedMonth < 1 || parsedMonth > 12 || isNaN(parsedYear)) {
      return res.redirect('/budgets?error=Bulan+atau+tahun+tidak+valid.');
    }

    await budgetService.saveBudget({
      userId,
      categoryId: parsedCategoryId,
      amount: parsedAmount,
      month: parsedMonth,
      year: parsedYear
    });

    return res.redirect(`/budgets?month=${parsedMonth}&year=${parsedYear}&success=Anggaran+berhasil+disimpan.`);
  } catch (err) {
    console.error('Error saving budget:', err);
    const queryMonth = parseInt(req.body.month) || new Date().getMonth() + 1;
    const queryYear = parseInt(req.body.year) || new Date().getFullYear();
    return res.redirect(`/budgets?month=${queryMonth}&year=${queryYear}&error=${encodeURIComponent(err.message || 'Gagal menyimpan anggaran.')}`);
  }
};

/**
 * Delete a budget
 */
exports.deleteBudget = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const month = req.query.month || new Date().getMonth() + 1;
  const year = req.query.year || new Date().getFullYear();

  try {
    const budgetId = parseInt(id, 10);
    if (isNaN(budgetId)) {
      return res.redirect(`/budgets?month=${month}&year=${year}&error=ID+anggaran+tidak+valid.`);
    }

    await budgetService.deleteBudget({ budgetId, userId });

    return res.redirect(`/budgets?month=${month}&year=${year}&success=Anggaran+berhasil+dihapus.`);
  } catch (err) {
    console.error('Error deleting budget:', err);
    return res.redirect(`/budgets?month=${month}&year=${year}&error=${encodeURIComponent(err.message || 'Gagal menghapus anggaran.')}`);
  }
};
