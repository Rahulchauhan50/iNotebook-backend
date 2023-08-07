const mongoose = require('mongoose')
const validator = require("validator")

const userSchema = mongoose.Schema({
    fristName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        default:null
    },
    profileImage:{
        type:String,
        default:null
    },
    email:{
        type:String,
        required:true,
        unique:true,
        validate(value){
            if(!validator.isEmail(value)){
                 throw new Error("Inalid email")
             }
         }
    },
    password:{
        type:String,
        required:true,
    },
    date: {
        type: Date,
        default: Date.now
    },
})

const User = mongoose.model('user',userSchema)
module.exports = User;