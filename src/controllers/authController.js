const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

/**
 * Display registration page
 */
exports.showRegister = (req, res) => {
  res.render('auth/register', {
    title: 'CatatKu - Registrasi',
    error: null,
    formData: { name: '', email: '' },
  });
};

/**
 * Handle user registration
 */
exports.register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password) {
      return res.render('auth/register', {
        title: 'CatatKu - Registrasi',
        error: 'Semua bidang wajib diisi.',
        formData: { name, email },
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'CatatKu - Registrasi',
        error: 'Konfirmasi kata sandi tidak cocok.',
        formData: { name, email },
      });
    }

    if (password.length < 6) {
      return res.render('auth/register', {
        title: 'CatatKu - Registrasi',
        error: 'Kata sandi minimal 6 karakter.',
        formData: { name, email },
      });
    }

    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.render('auth/register', {
        title: 'CatatKu - Registrasi',
        error: 'Email sudah terdaftar. Silakan gunakan email lain.',
        formData: { name, email },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default categories for new users
    const defaultCategories = [
      { name: 'Makanan', type: 'EXPENSE' },
      { name: 'Transportasi', type: 'EXPENSE' },
      { name: 'Pendidikan', type: 'EXPENSE' },
      { name: 'Hiburan', type: 'EXPENSE' },
      { name: 'Lainnya', type: 'EXPENSE' },
      { name: 'Pemasukan Umum', type: 'INCOME' },
    ];

    // Create user in database along with default categories
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        categories: {
          create: defaultCategories,
        },
      },
    });

    // Set session after successful registration
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Error during registration:', err);
    return res.render('auth/register', {
      title: 'CatatKu - Registrasi',
      error: 'Terjadi kesalahan pada server. Silakan coba lagi.',
      formData: { name, email },
    });
  }
};

/**
 * Display login page
 */
exports.showLogin = (req, res) => {
  res.render('auth/login', {
    title: 'CatatKu - Masuk',
    error: null,
    formData: { email: '' },
  });
};

/**
 * Handle user login
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.render('auth/login', {
        title: 'CatatKu - Masuk',
        error: 'Email dan kata sandi wajib diisi.',
        formData: { email },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.render('auth/login', {
        title: 'CatatKu - Masuk',
        error: 'Email atau kata sandi salah.',
        formData: { email },
      });
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.render('auth/login', {
        title: 'CatatKu - Masuk',
        error: 'Email atau kata sandi salah.',
        formData: { email },
      });
    }

    // Set session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Error during login:', err);
    return res.render('auth/login', {
      title: 'CatatKu - Masuk',
      error: 'Terjadi kesalahan pada server. Silakan coba lagi.',
      formData: { email },
    });
  }
};

/**
 * Handle user logout
 */
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.clearCookie('sid');
    return res.redirect('/auth/login');
  });
};
