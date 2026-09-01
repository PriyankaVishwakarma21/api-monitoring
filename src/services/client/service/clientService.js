import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";
import { APPLICATION_ROLES, isValidClientRole } from "../../../shared/constant/role.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export default class ClientService {
    constructor(dependencies) {
        if (!dependencies) throw new Error("Dependencies are required");

        if (!dependencies.clientRepository) throw new Error("ClientRepository is required");
        if (!dependencies.apiKeyRepository) throw new Error("APIKeyRepository is required");
        if (!dependencies.userRepository) throw new Error("UserRepository is required");

        this.clientRepository = dependencies.clientRepository;
        this.apiKeyRepository = dependencies.apiKeyRepository;
        this.userRepository = dependencies.userRepository;
    }

    formateClientForResponse(user) {
        const userObj = user.toObject ? user.toObject() : { ...user };
        delete userObj.password;
        return userObj;
    }

    /**
     * Generate unique slug from name
     * @param {String} name 
     * @returns {String}
     */
    generateSlug(name) {
        return name.toLocaleLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
    }

    /**
     * Create new client
     * @param {Object} clientData 
     * @param {Object} adminUser 
     * @returns {Promise<Object>}
     */
    async createClient(clientData, adminUser) {
        try {
            const { username, email, description, website } = clientData;

            const slug = this.generateSlug(username);

            const existingClient = await this.clientRepository.findBySlug(slug);
            if (existingClient) throw new AppError("Slug already exist", 400);

            const client = await this.clientRepository.create({
                username,
                slug,
                email,
                description,
                website,
                createdBy: adminUser.userId
            })

            return client;

        } catch (error) {
            logger.error("Error while creating client: ", error)
            throw error;
        }
    }

    canUserAccessClient(user, clientId) {
        if (user.role === APPLICATION_ROLES.SUPER_ADMIN) return true;
        return user.clientId && user.clientId.toString() === clientId.toString();
    }

    async createClientUsers(clientId, usersData, adminUser) {
        try {
            const client = await this.clientRepository.findById(clientId);
            if (!client) throw new AppError("Client not found", 404);

            if (!this.canUserAccessClient(adminUser, clientId)) throw new AppError("Access denied", 403);
            const { username, email, password, role = APPLICATION_ROLES.CLIENT_VIEWER } = usersData;

            if (!isValidClientRole(role)) throw new AppError("Invalid role", 400);

            let permissions = {
                canCreateApiKeys: false,
                canManageUsers: false,
                canViewAnalytics: true,
                canExportData: false
            }

            if (role === APPLICATION_ROLES.CLIENT_ADMIN) {
                permissions = {
                    canCreateApiKeys: true,
                    canManageUsers: true,
                    canViewAnalytics: true,
                    canExportData: true
                }
            }

            const user = await this.userRepository.create({
                username,
                email,
                password,
                role,
                clientId: clientId,
                permissions
            });

            logger.info(`Client user created`, { clientId, userId: user._id, role });
            return this.formateClientForResponse(user);

        } catch (error) {
            logger.error("Error while creating client users: ", error);
            throw error;
        }
    }

    generateApiKey() {
        const prefix = "apim";
        const randomBytes = crypto.randomBytes(20).toString('hex');
        return `${prefix}_${randomBytes}`;
    }

    async createClientApiKey(clientId, apiKeyData, user) {
        try {
            const client = await this.clientRepository.findById(clientId);
            if (!client) throw new AppError("Client not found", 404);

            if (!this.canUserAccessClient(user, clientId)) throw new AppError("Access denied", 403);

            if (!(user.role === APPLICATION_ROLES.CLIENT_ADMIN || user.role === APPLICATION_ROLES.SUPER_ADMIN)) {
                throw new AppError("Access denied - Only Super Admin and client admin can create API keys", 403);
            }
            const { name, description, environment = "prod" } = apiKeyData;

            const keyId = uuidv4();
            const keyValue = this.generateApiKey();
            const apiKey = await this.apiKeyRepository.create({
                keyId,
                keyValue,
                clientId,
                name,
                description,
                environment,
                clientId,
                createdBy: user.userId
            });

            logger.info(`Client API key created`, { clientId, apiKeyId: apiKey._id });
            return apiKey;
        } catch (error) {
            logger.error("Error while creating client API keys: ", error);
            throw error;
        }
    }

    async getClientApiKeys(clientId, user) {
        try {
            if (!this.canUserAccessClient(user, clientId)) throw new AppError("Access denied", 403);
            const apiKeys = await this.apiKeyRepository.findByClientId(clientId);

            const formattResponse = apiKeys.map((key) => {
                const keyObj = key.toObject ? key.toObject() : key;
                delete keyObj.keyValue;
                return keyObj;
            })

            return formattResponse;
        } catch (error) {
            logger.error("Error while getting API keys: ", error);
            next(error);
        }
    }
}