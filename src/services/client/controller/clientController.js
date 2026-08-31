import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";
import ClientService from "../service/clientService.js";
import ResponseFormatter from "../../../shared/utils/responseFormatter.js"

export default class ClientController {
    constructor(clientService, authService) {
        if (!clientService) throw new Error("ClientService is required");
        if (!authService) throw new Error("AuthService is required ");

        this.clientService = clientService;
        this.authService = authService;
    }

    async createClient(req, res, next) {
        try {
            const isSuperAdmin = await this.authService.checkSuperAdminPermissions(req.user.userId);
            
            if (!isSuperAdmin) return res.status(403).json(ResponseFormatter.error("Access denied", 403));
            
            const client = await this.clientService.createClient(req.body, req.user);
            return res.status(201).json(ResponseFormatter.success(client,"Client created successfully", 201))
        } catch (error) {
            logger.error("Error while creating client: ", error);
            next(error);
        }
    }
}