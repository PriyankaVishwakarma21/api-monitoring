import config from "../config/config.js";
import ResponseFormatter from "../utils/responseFormatter.js";
import jwt from 'jsonwebtoken'


const authenticate = async (req, res, next) => {
    try {
        let token = null;
        if (req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken;
        }

        if (!token) return res.status(401).json(ResponseFormatter.error("Authentication token is required", 401))
        const decode = await jwt.verify(token, config.jwt.secret);
        const { userId, email, username, role, clientId } = decode;
        req.user = {
            userId, email, username, role, clientId
        }
        next();
    } catch (error) {
        logger.error("Authentication Failed", {
            error: error.message,
            path: req.path
        });
        if (error.name === "TokenExpiredError") {
            return res.status(401).json(ResponseFormatter.error("Token Expired", 401));
        }

        return res.status(401).json(ResponseFormatter.error("Invalid token", 401));
    }
}


export default authenticate;