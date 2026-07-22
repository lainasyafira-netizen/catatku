const prisma = require('../lib/prisma');

/**
 * Display all budgets for the logged-in user for a specific month and year
 */
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get month and year from query params, default to current month/year
    const currentQueryMonth = parseInt(req.query.month) || new Date().getMonth() + 1;
    const currentQueryYear = parseInt(req.query.year) || new Date().getFullYear();

    // Fetch all EXPENSE categories
    const categories = await prisma.category.findMany({
      where: { userId, type: 'EXPENSE' },
      orderBy: { name: 'asc' },
    });

    // Fetch budgets for the selected month/year
    const budgets = await prisma.budget.findMany({
      where: { userId, month: currentQueryMonth, year: currentQueryYear },
      include: { category: true },
    });

    // Fetch all EXPENSE transactions for the selected month/year to calculate spent amount
    // Build date range for the month
    const startDate = new Date(currentQueryYear, currentQueryMonth - 1, 1);
    const endDate = new Date(currentQueryYear, currentQueryMonth, 1); // 1st day of next month

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // Group transactions by categoryId
    const spentByCategory = {};
    transactions.forEach(t => {
      if (!spentByCategory[t.categoryId]) {
        spentByCategory[t.categoryId] = 0;
      }
      spentByCategory[t.categoryId] += t.amount;
    });

    // Combine budgets with spent amounts and calculate progress
    const budgetData = budgets.map(b => {
      const spent = spentByCategory[b.categoryId] || 0;
      const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      let colorClass = 'bg-green-500';
      
      if (progress >= 100) {
        colorClass = 'bg-red-500';
      } else if (progress >= 80) {
        colorClass = 'bg-yellow-500';
      }

      return {
        ...b,
        spent,
        progress: Math.min(progress, 100), // Cap at 100% for progress bar display
        rawProgress: progress,
        colorClass,
      };
    }).sort((a, b) => b.rawProgress - a.rawProgress); // Sort by highest usage first

    // Generate alerts for > 80% usage
    const alerts = budgetData.filter(b => b.rawProgress >= 80).map(b => {
      if (b.rawProgress >= 100) {
        return `Peringatan Kritis: Anggaran "${b.category.name}" telah melebihi batas (Terpakai ${b.rawProgress.toFixed(1)}%)!`;
      } else {
        return `Perhatian: Anggaran "${b.category.name}" hampir habis (Terpakai ${b.rawProgress.toFixed(1)}%).`;
      }
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

    // Verify category belongs to user and is EXPENSE
    const category = await prisma.category.findFirst({
      where: { id: parsedCategoryId, userId, type: 'EXPENSE' },
    });

    if (!category) {
      return res.redirect(`/budgets?month=${parsedMonth}&year=${parsedYear}&error=Kategori+tidak+valid+atau+bukan+kategori+pengeluaran.`);
    }

    // Check if budget already exists for this category/month/year
    const existingBudget = await prisma.budget.findFirst({
      where: { userId, categoryId: parsedCategoryId, month: parsedMonth, year: parsedYear },
    });

    if (existingBudget) {
      // Update
      await prisma.budget.update({
        where: { id: existingBudget.id },
        data: { amount: parsedAmount },
      });
    } else {
      // Create
      await prisma.budget.create({
        data: {
          userId,
          categoryId: parsedCategoryId,
          amount: parsedAmount,
          month: parsedMonth,
          year: parsedYear,
        },
      });
    }

    return res.redirect(`/budgets?month=${parsedMonth}&year=${parsedYear}&success=Anggaran+berhasil+disimpan.`);
  } catch (err) {
    console.error('Error saving budget:', err);
    const queryMonth = parseInt(req.body.month) || new Date().getMonth() + 1;
    const queryYear = parseInt(req.body.year) || new Date().getFullYear();
    return res.redirect(`/budgets?month=${queryMonth}&year=${queryYear}&error=Gagal+menyimpan+anggaran.`);
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

    // Check ownership
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      return res.redirect(`/budgets?month=${month}&year=${year}&error=Anggaran+tidak+ditemukan.`);
    }

    // Delete
    await prisma.budget.delete({
      where: { id: budgetId },
    });

    return res.redirect(`/budgets?month=${month}&year=${year}&success=Anggaran+berhasil+dihapus.`);
  } catch (err) {
    console.error('Error deleting budget:', err);
    return res.redirect(`/budgets?error=Gagal+menghapus+anggaran.`);
  }
};
