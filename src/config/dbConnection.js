const mysql = require("mysql")
const dotenv = require("dotenv")
dotenv.config()

module.exports = () => {
    let host = process.env.DB_HOST;
    let database = process.env.DB_DATABASE
    let user = process.env.DB_USER
    let password = process.env.DB_PASSWORD
    let port = process.env.DB_PORT
    return mysql.createConnection({
        host:host,
        database:database,
        user:user,
        password:password,
        port:port
    })
    
}