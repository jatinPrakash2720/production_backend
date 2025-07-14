import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
})

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null

    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    })
    // file has been uploaded

    console.log("File is uploaded on Cloudinary", response)
    fs.unlinkSync(localFilePath)
    return response
  } catch (error) {
    fs.unlinkSync(localFilePath) //remove the locally saved temp. file as the upload operation got failed
    return null
  }
}
const deleteOnCloudinary = async (avatarURL) => {
  try {
    if (!avatarURL) return null
    const publicId = avatarURL // original string
      .split("/")
      .pop()
      .split(".")[0]

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    })
    console.log("File is deleted from Cloudinary", response)
    return response
  } catch (error) {
    console.log(error)
    return null
  }
}

export { uploadOnCloudinary, deleteOnCloudinary }
