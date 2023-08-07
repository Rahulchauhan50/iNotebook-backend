const express = require('express')
const router = express.Router();
const User = require('../modals/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const JWT_SECRET = process.env.JWT_SECRET
const fetchUser = require('../middleware/fetchUser')

router.post('/login',[
    body('email','enter a valid email').isEmail(),
    body('password','please enter passwors length must be alreast').exists(),
],async(req,res)=>{
   try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const {email, password} = req.body
    let user = await User.findOne({email})
    if(!user){
        return res.status(401).json({error:"user does not exist"})
    }
    const match = await bcrypt.compare(password ,user.password)
        
    if(!match){
        return res.status(401).json({error:"user does not match"})
    } 
    const data = {
        user:{id: user.id}
    }
    const AuthToken = jwt.sign(data,JWT_SECRET)
    
    res.json({"success":true,user,"authToken":AuthToken})


   } catch (error) {
    res.json({error:error,message:error.message}).status(500)
   }
})

router.post('/signup',[
    body('fristName','enter a valid name least 3 charactors').isLength({ min: 3 }),
    body('email','enter a valid email').isEmail(),
    body('password','passwors length must be alreast').isLength({ min: 5 }),
],async(req,res)=>{
   try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let user = await User.findOne({ email: req.body.email })
    if(user){
        return res.status(401).json({error:"user already exist"})
    }

    const salt = await bcrypt.genSalt(10);
    const SecPass = await bcrypt.hash(req.body.password,salt)
    user = await User.create({
        fristName: req.body.fristName,
        lastName: req.body.lastName,
        profileImage: req.body.profileImage,
        email: req.body.email,
        password: SecPass,
    })
    const data = {
        user:{id: user.id}
    }

    const AuthToken = jwt.sign(data,JWT_SECRET)
    res.json({"success":true,"authToken":AuthToken,user})

   } catch (error) {
    res.json({error:error,message:error.message}).status(500)
   }
})

router.post('/',fetchUser,async(req,res)=>{
    try {
        const userId = req.user.id
        const user = await User.findById(userId).select("-password")
        res.send(user)
    } catch (error) {
        res.json({error:err,mesage:"fetchUser error"}).status(500)
    }
})

module.exports = router