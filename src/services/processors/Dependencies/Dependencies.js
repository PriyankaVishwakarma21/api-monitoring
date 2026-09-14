import { APIHitRepository } from '../repository/APIRepository.js';
import { MatricsRepository } from '../repository/MatricsRepository.js'
import { ProcessorService } from '../services/ProcessorServices.js';
import ApiHit from '../../../shared/models/APIHits.js';
import postgres from '../../../shared/config/postgres.js';
import logger from '../../../shared/config/logger.js';

class Container {
    static init() {
        const repositories = {
            apiHitRepository: new APIHitRepository({ model: ApiHit, logger }),
            metricsRepository: new MatricsRepository({ logger, postgres })
        }

        const services = {
            processorService: new ProcessorService(repositories)
        }

        return { repositories, services }
    }
}

const initialized = Container.init();
export { Container };
export default initialized;