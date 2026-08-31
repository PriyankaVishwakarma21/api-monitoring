import ResponseFormatter from "../utils/responseFormatter.js"

const authorize = (allowedRole = []) => (req, res, next) => {
    try {
        if (!req.user || req.user.role) return res.status(403).json(ResponseFormatter.error("Forbidden", 403))

        // skip
        if (allowedRole.length == 0) {
            next();
        }
        if (!allowedRole.includes(req.user.role)) {
            return res.status(403).json(ResponseFormatter.error("Insufficient permissions", 403))
        }
        next();
    } catch (error) {
        return res.status(403).json(ResponseFormatter.error("Forbidden", 403))
    }
}

export default authorize;