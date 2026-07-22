const authService = require('../services/authService');

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
    // Basic validation in controller
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

    // Call service to handle business logic & database
    const user = await authService.registerUser({ name, email, password });

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
      // Display specific service error if it exists, else generic
      error: err.message || 'Terjadi kesalahan pada server. Silakan coba lagi.',
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

    // Call service
    const user = await authService.loginUser({ email, password });

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
      error: err.message || 'Terjadi kesalahan pada server. Silakan coba lagi.',
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
