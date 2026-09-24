/**
 * Sirf diye gaye roles wale users ko aage jane deta hai.
 *
 * NOTE: `module.exports` likhna zaroori hai. Sirf `exports = ...` likhne se
 * kuch export nahi hota -- wo local variable ko dobara bandh deta hai aur
 * require karne wale ko khali {} milta hai ("role is not a function").
 */
module.exports = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    next();
  };
};
