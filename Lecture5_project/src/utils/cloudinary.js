import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Ensure config is run first
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("Cloudinary Config: ", cloudinary.config());

const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log("Cloudinary.js/localFilePath: ", localFilePath);

        if (!localFilePath) return null;

        // console.log("At Upload Time/CLOUDINARY_CLOUD_NAME: ", process.env.CLOUDINARY_CLOUD_NAME);
        // console.log("At Upload Time/CLOUDINARY_API_KEY: ", process.env.CLOUDINARY_API_KEY);
        // console.log("At Upload Time/CLOUDINARY_API_SECRET: ", process.env.CLOUDINARY_API_SECRET);

        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // File has been uploaded successfully
        console.log("File uploaded on cloudinary: ", response.url);

        // Remove the file from the local storage
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.log("Error in cloudinary.js: ", error);
        fs.unlinkSync(localFilePath); // Remove local file after failure
        return null;
    }
};

export { uploadOnCloudinary };
