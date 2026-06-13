const isAdmin = (req, res, next) => {
    // ensure `protect` ran and provided `req.user`
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
};

export default isAdmin;