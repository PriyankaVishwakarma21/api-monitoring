import express from "express";
import clientDependecies from "../dependencies/clientDependencies.js"
import authenticate from "../../../shared/middleware/authenticate.js";
import ClientController from "../controller/clientController.js";

const router = express.Router();
const clientController = clientDependecies.controller.clientController;

router.use(authenticate);
router.post('/admin/clients/onboard', (req, res, next) => clientController.createClient(req, res, next));
router.post('/admin/clients/:clientId/users', (req, res, next) => clientController.createClientUsers(req, res, next));
router.post('/admin/clients/:clientId/apiKey', (req, res, next) => clientController.createClientApiKey(req, res, next));

router.get('/admin/clients/:clientId/apiKeys', (req, res, next) => clientController.getClientApiKeys(req, res, next))
export default router;