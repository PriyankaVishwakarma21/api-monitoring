import logger from "../../../shared/config/logger.js";
import ResponseFormatter from "../../../shared/utils/responseFormatter.js";

export class IngestController {
    constructor({ ingestService }) {
        if (!ingestService) throw new Error("IngestController required ingestService");
        this.ingestService = ingestService;
    }

    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {import("express").NextFunction} next 
     */
    async ingestHit(req, res, next) {
        try {
            logger.info("Ingest: Client data receied", {
                clientId: req.client._id,
                clientName: req.client.name,
                clientKeys: Object.keys(req.client)
            })
            const hitdata = {
                ...req.body,
                clientId: req.client._id,
                apiKeyId: req.apiKey._id,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user.agent'] || ''
            }
            logger.info("Ingest: Hit data prepared", {
                clientId: req.client._id,
                endpoint: hitdata.endpoint,
                method: hitdata.method
            })
            const result = await this.ingestService.ingestApiHit(hitdata);
            res.status(202).json(ResponseFormatter.success(result, "API Hit ququed for processing", 202))
        } catch (error) {
            next(error);
        }
    }
}