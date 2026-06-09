import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file for faster uploading and less bandwidth usage.
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - The compressed image file
 */
export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 1, // Max file size in MB
    maxWidthOrHeight: 1920, // Max width/height
    useWebWorker: true, // Use multi-threading
    fileType: 'image/webp' // Convert to WebP for better compression
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Create a new file with the proper extension
    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    return new File([compressedFile], newName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Image compression error:", error);
    return file; // Fallback to original file if compression fails
  }
};
