const mongoose = require('mongoose')
const dotenv = require('dotenv');
dotenv.config();

const DataBase = process.env.DB_URL

const connectToMongo = () => {
    mongoose.connect(DataBase, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log("conneted to database")
    }).catch(() => {

    })
}

module.exports = connectToMongo;