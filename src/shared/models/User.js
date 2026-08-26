import mongoose from "mongoose";
import bcrypt from "bcrypt";
import SecurityUtils from "../utils/SecurityUtils.js";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        validate: {
            validator: function (u) {
                return /^[a-zA-Z0-9_.-]+$/.test(u);
            },
            message: props => `${props.value} is not a valid username! Only alphanumeric characters are allowed.`
        }

    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (e) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        validate: {
            validator: function (p) {
                if (this.isModified('password') && p && !p.startsWith('$2b$')) {
                    const { success } = SecurityUtils.validatePassword(p);
                    return success;
                }
                return true;
            },
            message: props => {
                if (props.value && !props.value.startsWith('$2b$')) {

                    const { errors: passwordErrors } = SecurityUtils.validatePassword(props.value);
                    return passwordErrors.join('. ');
                }
                return 'Password validation failed. ';
            }
        }
    },
    role: {
        type: String,
        enum: ['super_admin', 'client_admin', 'client_viewer'],
        default: 'client_viewer '
    },
    clinetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: function () {
            return this.role !== 'super_admin';
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    permissions: {
        canCreateApiKeys: {
            type: Boolean,
            default: false
        },
        canManageUsers: {
            type: Boolean,
            default: false
        },
        canViewAnalytics: {
            type: Boolean,
            default: false
        },
        canExportData: {
            type: Boolean,
            default: false
        }

    }
}, { timestamps: true, collection: 'users' });


userSchema.pre('save', async function (next) {

    if (!this.isModified('password')) {
        return next();
    }

    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

// indexes are used to fasten the search queries and to ensure uniqueness of the fields. In this case, we are creating a compound index on clinetId and isActive fields to ensure that there can be only one active user per client.
userSchema.index({ clinetId: 1, isActive: 1 }, { unique: true });
userSchema.index({ role: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export default User;
