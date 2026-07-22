const prisma = require('../lib/prisma');

class CategoryService {
  async getCategories(userId) {
    return await prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async createCategory({ userId, name, type }) {
    // Check duplicate
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: { equals: name.trim(), mode: 'insensitive' },
        type,
      },
    });

    if (existing) {
      throw new Error('Kategori dengan nama dan tipe tersebut sudah ada.');
    }

    return await prisma.category.create({
      data: {
        userId,
        name: name.trim(),
        type,
      },
    });
  }

  async updateCategory({ categoryId, userId, name, type }) {
    // Check ownership
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new Error('Kategori tidak ditemukan.');
    }

    return await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        type,
      },
    });
  }

  async deleteCategory({ categoryId, userId }) {
    // Find category & check ownership + transaction count
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!category) {
      throw new Error('Kategori tidak ditemukan.');
    }

    // Constraint check: Cannot delete if transactions exist
    if (category._count.transactions > 0) {
      throw new Error('Kategori tidak dapat dihapus karena sedang digunakan dalam transaksi.');
    }

    return await prisma.category.delete({
      where: { id: categoryId },
    });
  }
}

module.exports = new CategoryService();
