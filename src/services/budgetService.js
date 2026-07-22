const prisma = require('../lib/prisma');

class BudgetService {
  async getBudgetData({ userId, month, year }) {
    // Fetch all EXPENSE categories
    const categories = await prisma.category.findMany({
      where: { userId, type: 'EXPENSE' },
      orderBy: { name: 'asc' },
    });

    // Fetch budgets for the selected month/year
    const budgets = await prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    });

    // Fetch all EXPENSE transactions for the selected month/year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startDate, lt: endDate },
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
        progress: Math.min(progress, 100),
        rawProgress: progress,
        colorClass,
      };
    }).sort((a, b) => b.rawProgress - a.rawProgress);

    // Generate alerts
    const alerts = budgetData.filter(b => b.rawProgress >= 80).map(b => {
      if (b.rawProgress >= 100) {
        return `Peringatan Kritis: Anggaran "${b.category.name}" telah melebihi batas (Terpakai ${b.rawProgress.toFixed(1)}%)!`;
      } else {
        return `Perhatian: Anggaran "${b.category.name}" hampir habis (Terpakai ${b.rawProgress.toFixed(1)}%).`;
      }
    });

    return { categories, budgetData, alerts };
  }

  async saveBudget({ userId, categoryId, amount, month, year }) {
    // Verify category belongs to user and is EXPENSE
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, type: 'EXPENSE' },
    });

    if (!category) {
      throw new Error('Kategori tidak valid atau bukan kategori pengeluaran.');
    }

    const existingBudget = await prisma.budget.findFirst({
      where: { userId, categoryId, month, year },
    });

    if (existingBudget) {
      return await prisma.budget.update({
        where: { id: existingBudget.id },
        data: { amount },
      });
    } else {
      return await prisma.budget.create({
        data: { userId, categoryId, amount, month, year },
      });
    }
  }

  async deleteBudget({ budgetId, userId }) {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new Error('Anggaran tidak ditemukan.');
    }

    return await prisma.budget.delete({
      where: { id: budgetId },
    });
  }
}

module.exports = new BudgetService();
