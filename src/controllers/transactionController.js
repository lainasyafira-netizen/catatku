const transactionService = require('../services/transactionService');

/**
 * Display all transactions for the logged-in user with pagination
 */
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const typeFilter = req.query.type;
    
    const { transactions, pagination } = await transactionService.getTransactions({
      userId,
      page,
      limit,
      typeFilter
    });

    const categories = await transactionService.getAllCategories(userId);

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render('transactions/index', {
      title: 'CatatKu - Kelola Transaksi',
      transactions,
      categories,
      pagination,
      currentTypeFilter: typeFilter,
      error,
      success,
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).render('transactions/index', {
      title: 'CatatKu - Kelola Transaksi',
      transactions: [],
      categories: [],
      pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 },
      currentTypeFilter: null,
      error: 'Terjadi kesalahan pada server saat memuat transaksi.',
      success: null,
    });
  }
};

/**
 * Create a new transaction
 */
exports.createTransaction = async (req, res) => {
  const { type, categoryId, amount, date, description } = req.body;
  const userId = req.session.userId;

  try {
    // Basic validation
    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.redirect('/transactions?error=Tipe+transaksi+tidak+valid.');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.redirect('/transactions?error=Jumlah+harus+berupa+angka+positif.');
    }

    if (!date || isNaN(new Date(date).getTime())) {
      return res.redirect('/transactions?error=Tanggal+tidak+valid.');
    }

    const parsedCategoryId = parseInt(categoryId, 10);
    if (isNaN(parsedCategoryId)) {
      return res.redirect('/transactions?error=Kategori+wajib+dipilih.');
    }

    await transactionService.createTransaction({
      userId,
      type,
      categoryId: parsedCategoryId,
      amount: parsedAmount,
      date,
      description
    });

    return res.redirect('/transactions?success=Transaksi+berhasil+ditambahkan.');
  } catch (err) {
    console.error('Error creating transaction:', err);
    return res.redirect(`/transactions?error=${encodeURIComponent(err.message || 'Gagal menambahkan transaksi.')}`);
  }
};

/**
 * Update an existing transaction
 */
exports.updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { type, categoryId, amount, date, description } = req.body;
  const userId = req.session.userId;

  try {
    const transactionId = parseInt(id, 10);
    if (isNaN(transactionId)) {
      return res.redirect('/transactions?error=ID+transaksi+tidak+valid.');
    }

    // Validation
    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.redirect('/transactions?error=Tipe+transaksi+tidak+valid.');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.redirect('/transactions?error=Jumlah+harus+berupa+angka+positif.');
    }

    if (!date || isNaN(new Date(date).getTime())) {
      return res.redirect('/transactions?error=Tanggal+tidak+valid.');
    }

    const parsedCategoryId = parseInt(categoryId, 10);
    if (isNaN(parsedCategoryId)) {
      return res.redirect('/transactions?error=Kategori+wajib+dipilih.');
    }

    await transactionService.updateTransaction({
      transactionId,
      userId,
      type,
      categoryId: parsedCategoryId,
      amount: parsedAmount,
      date,
      description
    });

    return res.redirect('/transactions?success=Transaksi+berhasil+diperbarui.');
  } catch (err) {
    console.error('Error updating transaction:', err);
    return res.redirect(`/transactions?error=${encodeURIComponent(err.message || 'Gagal mengedit transaksi.')}`);
  }
};

/**
 * Delete a transaction
 */
exports.deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const transactionId = parseInt(id, 10);
    if (isNaN(transactionId)) {
      return res.redirect('/transactions?error=ID+transaksi+tidak+valid.');
    }

    await transactionService.deleteTransaction({ transactionId, userId });

    return res.redirect('/transactions?success=Transaksi+berhasil+dihapus.');
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return res.redirect(`/transactions?error=${encodeURIComponent(err.message || 'Gagal menghapus transaksi.')}`);
  }
};
