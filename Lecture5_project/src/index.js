// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
dotenv.config({ path: './.env' });
import connectDB from "./db/index.js";
import { app } from './app.js'


console.log("Environment Variables Loaded:");
console.log("PORT: ", process.env.PORT);
console.log("CLOUDINARY_CLOUD_NAME: ", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY: ", process.env.CLOUDINARY_API_KEY);
console.log("CLOUDINARY_API_SECRET: ", process.env.CLOUDINARY_API_SECRET);



connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })










/*
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/