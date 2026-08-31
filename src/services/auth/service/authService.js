import jwt from 'jsonwebtoken';
import AppError from '../../../shared/utils/AppError.js'
import config from '../../../shared/config/config.js';
import logger from '../../../shared/config/logger.js';
import { APPLICATION_ROLES } from "../../../shared/constant/role.js"
import bcrypt from 'bcryptjs';

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

    async comparePassword(password, userPassword) {
        return await bcrypt.compare(password, userPassword);
    }

    async login(username, password) {
        try {
            const user = await this.userRepository.findByUsername(username);
            if (!user) throw new AppError("Invalid credentials", 401);

            if (!user.isActive) throw new AppError("Account is deactivated", 403);

            const isPassword = await this.comparePassword(password, user.password);

            if (!isPassword) throw new AppError("Invalid credentials", 401);

            const token = this.generateToken(user);
            logger.info('User loggedin successfully', { username: username });
            return { user: this.formateUserForResponse(user), token };
        } catch (error) {
            logger.error('Error while login ', error);
            throw error;
        }
    }

    async getProfile(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) throw new AppError("User not Found", 404);
            return this.formateUserForResponse(user);
        } catch (error) {
            logger.error('Error while getting userProfile ', error);
            throw error;
        }
    }

    async checkSuperAdminPermissions(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) throw new AppError("User not Found", 404);
            return user.role == APPLICATION_ROLES.SUPER_ADMIN;
        } catch (error) {
            logger.error('Error while checking super admin permissions ', error);
            throw error;
        }
    }
} 