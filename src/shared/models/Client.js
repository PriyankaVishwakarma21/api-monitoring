import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        // validate: {
        //     validator: function (u) {
        //         return /^[a-zA-Z0-9_.-]+$/.test(u);
        //     },
        //     message: props => `${props.value} is not a valid username! Only alphanumeric characters are allowed.`
        // }

    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^[a-z0-9_-]+$/,
        // validate: {
        //     validator: function (e) {
        //         return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
        //     },
        //     message: props => `${props.value} is not a valid email address!`
        // }
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
    description: {
        type: String,
        maxlength: 500,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    settings: {
        dataRetentionDays: {
            type: Number,
            default: 30,
            min: 7,
            max: 365
        },
        alertsEnabled: {
            type: Boolean,
            default: true
        },
        timezone: {
            type: String,
            default: 'UTC'
        }

    }
}, { timestamps: true, collection: 'clients' });



// indexes are used to fasten the search queries and to ensure uniqueness of the fields. In this case, we are creating a compound index on clinetId and isActive fields to ensure that there can be only one active user per client.
clientSchema.index({ isActive: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;
