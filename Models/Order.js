const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pointSchema = new Schema({
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    }
})

const orderSchema = new Schema({
    customer: {
        type: String,
        required: true
    },
    departure: {
        type: pointSchema,
        required: true
    },
    destination: {
        type: pointSchema,
        required: true
    },
    driver: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    startedAt: {
        type: Date
    },
    finishedAt: {
        type: Date
    },
    driverComponent: {
        type: String
    }
}, {
    collection: 'order'
  })

module.exports = mongoose.model('order', orderSchema)