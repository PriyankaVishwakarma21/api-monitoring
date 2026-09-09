import BaseClientRepository from "./baseClientRepository.js";
import Client from '../../../shared/models/Client.js'
import logger from '../../../shared/config/logger.js'

class MongoClientRepository extends BaseClientRepository {
    constructor() {
        super(Client)
    }

    /**
     * Creates a new client
     * @param {Object} clientData 
     * @returns {Promise<Object>}
     */
    async create(clientData) {
        try {
            const client = new this.model(clientData);
            await client.save();

            await client.populate({ path: "createdBy", select: "-password" });

            logger.info("Clinet created in MongoDB", {
                mondoId: client._id,
                slug: client.sug
            })
            return client;
        } catch (error) {
            logger.error("Error while creating clinet in Mongo", error);
            throw error;
        }
    }

    /**
     * Find client by clientId
     * @param {string} clinetId 
     * @returns {Promise<Object>}
     */
    async findById(clinetId) {
        try {
            const client = await this.model.findById(clinetId);
            logger.info("Clinet details from MongoDB", client);
            return client;
        } catch (error) {
            logger.error("Error while finding client ", error);
            throw error;
        }
    }

    /**
     * Find client by clientId
     * @param {string} clinetId
     * @returns {Promise<Object>}
     */
    async findBySlug(slug) {
        try {
            const client = await this.model.findOne({ slug });
            logger.info("Clinet details from MongoDB", client);
            return client;
        } catch (error) {
            logger.error("Error while finding client ", error);
            throw error;
        }
    }

    /**
     * Get the client data in pagination
     * @param {Object} filters 
     * @param {Object} options 
     * @returns {Promise<Object>}
     */
    // Implement coursor pagination latter 
    async find(filters = {}, options = {}) {
        try {
            const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;

            const clients = await this.model.find(filters)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-__v');

            return clients;
        } catch (error) {
            logger.error("Error while finding client ", error);
            throw error;
        }
    }

    /**
     * Count the client matching filter
     * @param {Object} filters  - Query filters
     * @returns {Promise<number>}
     */
    async count(filters = {}) {
        try {
            const count = await this.model.countDocuments(filters);
            return count
        } catch (error) {
            logger.error("Error while counting clients:  ", error);
            throw error;
        }
    }


}

export default new MongoClientRepository;