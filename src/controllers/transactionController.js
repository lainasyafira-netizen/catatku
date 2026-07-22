const prisma = require('../lib/prisma');

/**
 * Display all transactions for the logged-in user with pagination
 */
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const typeFilter = req.query.type;
    
    // Build where clause
    const where = { userId };
    if (typeFilter && ['INCOME', 'EXPENSE'].includes(typeFilter)) {
      where.type = typeFilter;
    }

    const skip = (page - 1) * limit;

    // Fetch total count for pagination
    const totalItems = await prisma.transaction.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    // Fetch all categories for the add/edit forms
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    const error = req.query.error || null;
    const success = req.query.success || null;

    res.render('transactions/index', {
      title: 'CatatKu - Kelola Transaksi',
      transactions,
      categories,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
      },
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

    // Verify category belongs to user and matches type (optional but good practice)
    const category = await prisma.category.findFirst({
      where: { id: parsedCategoryId, userId, type },
    });

    if (!category) {
      return res.redirect('/transactions?error=Kategori+tidak+valid+atau+tidak+sesuai+tipe.');
    }

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId,
        categoryId: parsedCategoryId,
        type,
        amount: parsedAmount,
        date: new Date(date),
        description: description ? description.trim() : null,
      },
    });

    return res.redirect('/transactions?success=Transaksi+berhasil+ditambahkan.');
  } catch (err) {
    console.error('Error creating transaction:', err);
    return res.redirect('/transactions?error=Gagal+menambahkan+transaksi.');
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

    // Check ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      return res.redirect('/transactions?error=Transaksi+tidak+ditemukan.');
    }

    // Verify category belongs to user and matches type
    const category = await prisma.category.findFirst({
      where: { id: parsedCategoryId, userId, type },
    });

    if (!category) {
      return res.redirect('/transactions?error=Kategori+tidak+valid+atau+tidak+sesuai+tipe.');
    }

    // Update transaction
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        categoryId: parsedCategoryId,
        type,
        amount: parsedAmount,
        date: new Date(date),
        description: description ? description.trim() : null,
      },
    });

    return res.redirect('/transactions?success=Transaksi+berhasil+diperbarui.');
  } catch (err) {
    console.error('Error updating transaction:', err);
    return res.redirect('/transactions?error=Gagal+mengedit+transaksi.');
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

    // Check ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      return res.redirect('/transactions?error=Transaksi+tidak+ditemukan.');
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return res.redirect('/transactions?success=Transaksi+berhasil+dihapus.');
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return res.redirect('/transactions?error=Gagal+menghapus+transaksi.');
  }
};
