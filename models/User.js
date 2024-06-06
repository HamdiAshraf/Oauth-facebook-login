require('dotenv').config()
const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})


const userSchema = new mongoose.Schema({
    uid: String,
    token: String,
    email: String,
    name: String,
    pic: String,
})


module.exports = mongoose.model('User', userSchema)