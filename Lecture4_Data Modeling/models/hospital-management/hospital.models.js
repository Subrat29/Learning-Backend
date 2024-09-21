import mongoose from 'mongoose'

const hospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    doctors: {
        type: mongoose.Schema.Types.ObjectId,
        required: 'Doctor',
    },
    pincode: {
        type: String,
        required: true,
    },
    specializedIn: {
        type: String,
        required: true,
    }
    
}, {timestamps: true});

export const Hospital = mongoose.model('Hospital', hospitalSchema);