import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Ensure config is run first
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// console.log("Cloudinary Config: ", cloudinary.config());

const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log("Cloudinary.js/localFilePath: ", localFilePath);

        if (!localFilePath) return null;

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
        console.log("Error in uploading file on cloudinary: ", error);
        fs.unlinkSync(localFilePath); // Remove local file after failure
        return null;
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        // Delete the file from cloudinary
        const response = await cloudinary.uploader.destroy(publicId);

        // File has been deleted successfully
        console.log("File deleted from cloudinary: ", response.result);

        return response;

    } catch (error) {
        console.log("Error in deleting file from cloudinary: ", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
