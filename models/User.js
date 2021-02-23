const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userSchema = new Schema({
  id: { 
    type: String,
    required: true
  },
  name: {
    type: String,
    min: [2, 'Too short, min is 2 characters']
  },
  password: {
    type: String,
    min: [5, 'Too short, min is 5 characters'],
    max: [32, 'Too long, max is 15 characters'],
    required: 'Password is required'
  },
  role: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
    collection: 'users'
  })
  
module.exports = mongoose.model('user', userSchema)