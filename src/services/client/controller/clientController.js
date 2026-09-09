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
            return res.status(201).json(ResponseFormatter.success(client, "Client created successfully", 201));
        } catch (error) {
            logger.error("Error while creating client: ", error);
            next(error);
        }
    }

    async createClientUsers(req, res, next) {
        try {
            const { clientId } = req.params;
            const user = await this.clientService.createClientUsers(clientId, req.body, req.user);
            return res.status(201).json(ResponseFormatter.success(user, "Client user created successfully", 201))

        } catch (error) {
            logger.error("Error while creating client users: ", error);
            next(error);
        }
    }

    async createClientApiKey(req, res, next) {
        try {
            const { clientId } = req.params;
            const apiKey = await this.clientService.createClientApiKey(clientId, req.body, req.user);
            return res.status(201).json(ResponseFormatter.success(apiKey, "Client API key created successfully", 201))

        } catch (error) {
            logger.error("Error while creating client API keys: ", error);
            next(error);
        }
    }

    async getClientApiKeys(req, res, next) {
        try {
            const { clientId } = req.params;
            const apiKeys = await this.clientService.getClientApiKeys(clientId, req.user);
            return res.status(200).json(ResponseFormatter.success(apiKeys, "API Keys fetched successfully", 200));
        } catch (error) {
            logger.error("Error while getting API keys: ", error);
            next(error);
        }
    }
}