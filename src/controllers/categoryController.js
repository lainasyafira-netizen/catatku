const categoryService = require('../services/categoryService');

/**
 * Display all categories for the logged-in user
 */
exports.getCategories = async (req, res) => {
  try {
    const userId = req.session.userId;
    const categories = await categoryService.getCategories(userId);

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

    await categoryService.createCategory({ userId, name, type });

    return res.redirect('/categories?success=Kategori+berhasil+ditambahkan.');
  } catch (err) {
    console.error('Error creating category:', err);
    return res.redirect(`/categories?error=${encodeURIComponent(err.message || 'Gagal menambahkan kategori.')}`);
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

    await categoryService.updateCategory({ categoryId, userId, name, type });

    return res.redirect('/categories?success=Kategori+berhasil+diperbarui.');
  } catch (err) {
    console.error('Error updating category:', err);
    return res.redirect(`/categories?error=${encodeURIComponent(err.message || 'Gagal mengedit kategori.')}`);
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

    await categoryService.deleteCategory({ categoryId, userId });

    return res.redirect('/categories?success=Kategori+berhasil+dihapus.');
  } catch (err) {
    console.error('Error deleting category:', err);
    return res.redirect(`/categories?error=${encodeURIComponent(err.message || 'Gagal menghapus kategori.')}`);
  }
};
