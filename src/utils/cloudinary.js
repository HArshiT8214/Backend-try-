import { v2 as cloudinary } from "cloudinary";
import fs from "fs"


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadResult = async (localPath) => {
    try {
        if (!localPath) return null
        const res = await cloudinary.uploader.upload(localPath, { resource_type: "auto" });
        // console.log("file uploaded sucessfully", res);
        fs.unlinkSync(localPath);
        return res;
    } catch (error) {
        fs.unlinkSync(localPath)
        return null
    }
}

export { uploadResult }