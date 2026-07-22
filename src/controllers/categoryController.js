const prisma = require('../lib/prisma');

/**
 * Display all categories for the logged-in user
 */
exports.getCategories = async (req, res) => {
  try {
    const userId = req.session.userId;
    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render('categories/index', {
      title: 'CatatKu - Kelola Kategori',
      categories,
      error,
      success,
      formData: { name: '', type: 'EXPENSE' },
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).render('categories/index', {
      title: 'CatatKu - Kelola Kategori',
      categories: [],
      error: 'Terjadi kesalahan pada server saat memuat kategori.',
      success: null,
      formData: { name: '', type: 'EXPENSE' },
    });
  }
};

/**
 * Create a new category
 */
exports.createCategory = async (req, res) => {
  const { name, type } = req.body;
  const userId = req.session.userId;

  try {
    if (!name || !name.trim()) {
      return res.redirect('/categories?error=Nama+kategori+tidak+boleh+kosong.');
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.redirect('/categories?error=Tipe+kategori+tidak+valid.');
    }

    // Check duplicate
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: { equals: name.trim(), mode: 'insensitive' },
        type,
      },
    });

    if (existing) {
      return res.redirect('/categories?error=Kategori+dengan+nama+dan+tipe+tersebut+sudah+ada.');
    }

    await prisma.category.create({
      data: {
        userId,
        name: name.trim(),
        type,
      },
    });

    return res.redirect('/categories?success=Kategori+berhasil+ditambahkan.');
  } catch (err) {
    console.error('Error creating category:', err);
    return res.redirect('/categories?error=Gagal+menambahkan+kategori.');
  }
};

/**
 * Update an existing category
 */
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;
  const userId = req.session.userId;

  try {
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return res.redirect('/categories?error=ID+kategori+tidak+valid.');
    }

    if (!name || !name.trim()) {
      return res.redirect('/categories?error=Nama+kategori+tidak+boleh+kosong.');
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.redirect('/categories?error=Tipe+kategori+tidak+valid.');
    }

    // Check ownership
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      return res.redirect('/categories?error=Kategori+tidak+ditemukan.');
    }

    await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        type,
      },
    });

    return res.redirect('/categories?success=Kategori+berhasil+diperbarui.');
  } catch (err) {
    console.error('Error updating category:', err);
    return res.redirect('/categories?error=Gagal+mengedit+kategori.');
  }
};

/**
 * Delete a category (blocked if used in transactions)
 */
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return res.redirect('/categories?error=ID+kategori+tidak+valid.');
    }

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
      return res.redirect('/categories?error=Kategori+tidak+ditemukan.');
    }

    // Constraint check: Cannot delete if transactions exist
    if (category._count.transactions > 0) {
      return res.redirect(
        '/categories?error=Kategori+tidak+dapat+dihapus+karena+sedang+digunakan+dalam+transaksi.'
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return res.redirect('/categories?success=Kategori+berhasil+dihapus.');
  } catch (err) {
    console.error('Error deleting category:', err);
    return res.redirect('/categories?error=Gagal+menghapus+kategori.');
  }
};
