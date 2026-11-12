const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const ENV = require("./env");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(ENV.mongoUrl);
        console.log("mongoDB connected:", conn.connection.host);
        return conn;
    } catch (error) {
        console.error("DB error:", error.message);
        throw error;
    }
};

module.exports = connectDB;
