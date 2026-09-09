import MongoClientRepository from "../repository/clientRepository.js";
import MongoAPIKeyRepository from "../repository/apiKeyRepository.js";
import MongooUserRepository from "../../auth/repository/UserRepository.js";

import ClientService from "../service/clientService.js";
import ClientController from "../controller/clientController.js";

import authContainer from "../../auth/Dependencies/dependencies.js";

class Container {
    constructor() { }
    static init() {
        const repositories = {
            clientRepository: MongoClientRepository,
            apiKeyRepository: MongoAPIKeyRepository,
            userRepository: MongooUserRepository
        };

        const services = {
            clientService: new ClientService({
                clientRepository: repositories.clientRepository,
                apiKeyRepository: repositories.apiKeyRepository,
                userRepository: repositories.userRepository
            })
        }

        const controller = {
            clientController: new ClientController(services.clientService, authContainer.services.authService)
        }

        return { repositories, services, controller };
    }
}

const intialized = Container.init();
export { Container };
export default intialized;