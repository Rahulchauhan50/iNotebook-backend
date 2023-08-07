const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
const dotenv = require('dotenv');
dotenv.config();

const fetchUser = (req,res,next) => {
    const token = req.header('auth-token')
    if(!token){
        return res.status(401).send({error:"access denied"})
    }
    try {
        const data = jwt.verify(token,JWT_SECRET)
        req.user = data.user;
        next()
        
    } catch (error) {
        res.status(401).send({error:"access denied"})
        
    }
}

module.exports = fetchUser