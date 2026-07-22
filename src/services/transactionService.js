const prisma = require('../lib/prisma');

class TransactionService {
  async getTransactions({ userId, page, limit, typeFilter }) {
    const where = { userId };
    if (typeFilter && ['INCOME', 'EXPENSE'].includes(typeFilter)) {
      where.type = typeFilter;
    }

    const skip = (page - 1) * limit;

    const [totalItems, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      transactions,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
      },
    };
  }

  async getAllCategories(userId) {
    return await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async createTransaction({ userId, type, categoryId, amount, date, description }) {
    // Verify category belongs to user and matches type
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, type },
    });

    if (!category) {
      throw new Error('Kategori tidak valid atau tidak sesuai tipe.');
    }

    return await prisma.transaction.create({
      data: {
        userId,
        categoryId,
        type,
        amount,
        date: new Date(date),
        description: description ? description.trim() : null,
      },
    });
  }

  async updateTransaction({ transactionId, userId, type, categoryId, amount, date, description }) {
    // Check ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new Error('Transaksi tidak ditemukan.');
    }

    // Verify category belongs to user and matches type
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, type },
    });

    if (!category) {
      throw new Error('Kategori tidak valid atau tidak sesuai tipe.');
    }

    return await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        categoryId,
        type,
        amount,
        date: new Date(date),
        description: description ? description.trim() : null,
      },
    });
  }

  async deleteTransaction({ transactionId, userId }) {
    // Check ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new Error('Transaksi tidak ditemukan.');
    }

    return await prisma.transaction.delete({
      where: { id: transactionId },
    });
  }
}

module.exports = new TransactionService();
