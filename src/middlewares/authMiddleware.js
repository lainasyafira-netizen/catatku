/**
 * Middleware to require authentication.
 * Protects routes from unauthenticated access.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
}

/**
 * Middleware to redirect authenticated users away from guest-only pages (login/register).
 */
function redirectIfAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  next();
}

module.exports = {
  requireAuth,
  redirectIfAuth,
};
