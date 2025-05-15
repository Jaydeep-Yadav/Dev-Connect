import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Delete a file from Cloudinary by public ID
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise}
 */
export const deleteFromCloudinary = async (publicUrl) => {

  try {
    if (!publicUrl) {
      console.error("Image URL is null or undefined");
      return;
    }

    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/;
    const match = publicUrl.match(regex);
    const path = decodeURIComponent(match[1])

    await cloudinary.api.delete_resources(path,
      { type: 'upload', resource_type: 'image' })
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

export default cloudinary;
