import config from "../../../shared/config/config.js";
import logger from "../../../shared/config/logger.js";
import { APPLICATION_ROLES } from "../../../shared/constant/role.js";
import ResponseFormatter from '../../../shared/utils/responseFormatter.js'

export class AuthController {
    constructor(authService) {
        if (!authService) throw new Error('authService is Required')
        this.authService = authService
    }

    async onboardSuperAdmin(req, res, next) {
        try {
            const { username, email, password } = req.body;
            const superAdminData = {
                username, email, password, role: APPLICATION_ROLES.SUPER_ADMIN
            }

            const { user, token } = await this.authService.onboardSuperAdmin(superAdminData);

            res.cookie('authToken', token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.maxAge
            })

            res.status(201).json(ResponseFormatter.success(user, "Super Admin created successfully", 201))
        } catch (error) {
            next(error);
        }
    }
}