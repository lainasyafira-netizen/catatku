const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

class AuthService {
  async registerUser({ name, email, password }) {
    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain.');
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

    return user;
  }

  async loginUser({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error('Email atau kata sandi salah.');
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email atau kata sandi salah.');
    }

    return user;
  }
}

module.exports = new AuthService();
