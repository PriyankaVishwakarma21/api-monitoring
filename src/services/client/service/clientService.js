import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";


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
}