
import logger from "../../../shared/config/logger.js";

export default class BaseAPIKeyRepository {
    constructor(model) {
        this.model = model;
    }

    async create(apiKeyData) {
        throw new Error("method not implemented");
    }

    async findByKeyValue(keyValue, includeInactive) {
        throw new Error("method not implemented");
    }

    async findByClientId(clientId, filters) {
        throw new Error("method not implemented");
    }

    async countByClientId(clientId, filters) {
        throw new Error("method not implemented");
    }
}