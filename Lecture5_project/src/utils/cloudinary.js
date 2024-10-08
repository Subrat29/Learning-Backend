import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload an image
        const uploadResult = await cloudinary.uploader
            .upload(
                localFilePath, {
                resource_type: "auto",
            })
        console.log("File Succesfully uploaded on cloudinary! ", uploadResult.url);
        return uploadResult;
    } catch (error) {
        // Remove the locally saved temp file as the upload operation got failed.
        fs.unlinkSync(localFilePath);
        console.error(error);
        return null;
    }
}

export { uploadOnCloudinary }