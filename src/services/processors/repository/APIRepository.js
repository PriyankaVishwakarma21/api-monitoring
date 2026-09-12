import { BaseRepository } from "./BaseRepository.js";


export class APIHitRepository extends BaseRepository {
    constructor({ model, logger: l = {} }) {
        super({ logger: l })
        if (!model) throw new Error("APIHitRepository requires model");
        this.model = model;
    }

    async save(eventData) {
        try {
            const doc = new this.model(eventData);
            await doc.save();

            this.logger.info("API hit save to mongoDB", { eventId: eventData.eventId })
        } catch (error) {
            if (error && error.code == 11000) {
                this.logger.error("Duplicate eventId, skipping save", { eventId: eventData.eventId });
                return null;
            }
            this.logger.error("Error while saving API", error);
            throw error;
        }
    }

    async find(filter = {}, otpions = {}) {
        try {
            const { limit = 100, skip = 0, sort = { timestamp: -1 } } = otpions;
            const hits = await this.model.find(filter).sort(sort).limit(limit).skip(skip).lean();
            // lean: mongo always return mongo document. we want normal js object
            return hits;
        } catch (error) {
            this.logger.error("Error while findig API hits: ", error);
            throw error;
        }
    }

    async count(filters = {}) {
        try {
            const count = await this.model.countDocuments(filters);
            return count;
        } catch (error) {
            this.logger.error("Error while counting API hits: ", error);
            throw error;
        }
    }

    async deleteOldHits(beforeHits) {
        try {
            const result = await this.model.deleteMany({ timestamp: { $lt: beforeHits } });
            this.logger.info('Deleted Old API hits: ', { count: result.deletedCount });
            return result.deletedCount;
        } catch (error) {
            this.logger.error("Error while deleting API hits: ", error);
            throw error;
        }
    }
} 