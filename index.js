const express = require('express')
const connectToMongo = require('./db')
const cors = require('cors');
const port = process.env.PORT || 5000
const app = express()

connectToMongo();

app.use(cors())
app.use(express.json())

app.use('/auth',require('./routes/auth'))


app.listen(port,()=>{
    console.log(`you are listening at ${port}`)
})