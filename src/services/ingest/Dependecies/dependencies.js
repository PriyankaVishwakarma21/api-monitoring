import { createEventProducer } from '../../../shared/events/procedures/createEventProducer.js';
import { IngestController } from '../controller/ingestController.js';
import { IngestService } from '../services/ingestService.js';
class Container {
    static init() {
        const eventProducer = createEventProducer();

        const service = {
            ingestService: new IngestService({ eventProducer })
        }

        const controller = {
            ingestController: new IngestController(service)
        }

        return { service, controller };
    }
}

const container = Container.init();

export default {
    ingestService: container.service.ingestService,
    ingestController: container.controller.ingestController,
    Container
}