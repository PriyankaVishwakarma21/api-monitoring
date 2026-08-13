/**
 * SecurityUtils is a utility class that provides methods for security-related operations.
 */
class SecurityUtils {

    static PASSWORD_REQUIREMENTS = {
        minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
        maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH) || 20,
        requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
        requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
        requireNumber: process.env.PASSWORD_REQUIRE_NUMBER === 'true',
        requireSpecialCharacter: process.env.PASSWORD_REQUIRE_SPECIAL_CHARACTER === 'true'
    }

    /**
     * Validates a password against the defined requirements.
     * @param {string} password 
     * @returns {Object} Validate res. with success flag and error message.
     */
    static validatePassword(password) {
        const errors = [];
        const requirements = this.PASSWORD_REQUIREMENTS;
        if (!password) {
            return { success: false, errors: ['Password is required.'] };
        }
        if (password.length < requirements.minLength) {
            errors.push(`Password must be at least ${requirements.minLength} characters long.`);
        }
        if (password.length > requirements.maxLength) {
            errors.push(`Password must be no more than ${requirements.maxLength} characters long.`);
        }
        if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter.');
        }
        if (requirements.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter.');
        }
        if (requirements.requireNumber && !/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number.');
        }
        if (requirements.requireSpecialCharacter && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character.');
        }

        const weakPasswordPatterns = [
            '123456',
            'password',
            '123456789',
            '12345678',
            '12345',
            '111111',
            '1234567',
            'sunshine',
            'qwerty',
            'iloveyou',
            'princess',
            'admin',
            'welcome',
            '666666',
            'abc123'
        ]

        if (weakPasswordPatterns.includes(password)) {
            errors.push('Password is too common or easily guessable.');
        }

        return { success: errors.length === 0, errors };
    }
}