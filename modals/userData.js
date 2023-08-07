const mongoose = require('mongoose')

const DataSchema = mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
    },
})

const Data = mongoose.model('data',DataSchema)

module.exports = Data;