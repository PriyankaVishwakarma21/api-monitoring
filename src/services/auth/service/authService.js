import jwt from 'jsonwebtoken';
import AppError from '../../../shared/utils/AppError.js'
import config from '../../../shared/config/config.js';
import logger from '../../../shared/config/logger.js';

export class AuthService {
    constructor(userRepository) {
        if (!userRepository) throw new Error('userRepository is Required')
        this.userRepository = userRepository
    }

    generateToken(user) {
        const { _id, email, username, role, clientID } = user;
        const playload = {
            userId: _id,
            email,
            username,
            role,
            clientID
        }

        return jwt.sign(playload, config.jwt.secret, { expiresIn: config.jwt.expireIn });
    }

    formateUserForResponse(user) {
        const userObj = user.toObject ? user.toObject() : { ...user };
        delete userObj.password;
        return userObj;
    }

    async onboardSuperAdmin(superAdminData) {
        try {
            const existingUser = await this.userRepository.findAll()
            
            if (existingUser && existingUser.length > 0) {
                throw new AppError('Super admin onboarding is disabled', 403)
            }
            const user = await this.userRepository.create(superAdminData);
            const token = this.generateToken(user)

            logger.info('Admin onboarded successfully', { username: user.username })
            return { user: this.formateUserForResponse(user), token }
        } catch (error) {
            logger.error('Error while onboarding super admin', error);
            throw error;
        }
    }

    async register(data) {
        try {
            const existingUser = await this.userRepository.findByUsername(data.username);
            if (existingUser) {
                throw new AppError('Username already exist', 409)
            }

            const existingUserWithEmail = await this.userRepository.findByEmail(data.email);
            if (existingUserWithEmail) {
                throw new AppError('Email already exist', 409)
            }

            const user = await this.userRepository.create(data);
            const token = this.generateToken(user)

            logger.info('Admin onboarded successfully', { username: user.username })
            return { user: this.formateUserForResponse(user), token }
        } catch (error) {
            logger.error('Error while register ', error);
            throw error;
        }
    }
} 