const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  dean: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema);
