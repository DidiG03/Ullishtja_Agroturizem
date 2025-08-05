// Vercel Serverless Function for Blog Image Upload API
// Handles POST requests for uploading blog images

const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

// Disable the default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Parse the form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      keepExtensions: true,
      filter: ({ mimetype }) => {
        // Only allow image types
        return mimetype && mimetype.includes('image');
      }
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.image || !files.image[0]) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const uploadedFile = files.image[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(uploadedFile.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(uploadedFile.originalFilename || '.jpg');
    const basename = path.basename(uploadedFile.originalFilename || 'image', extension);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `${sanitizedBasename}-${uniqueSuffix}${extension}`;

    // For Vercel, we need to return the file content directly
    // Since Vercel doesn't support persistent file storage, 
    // this is a simplified version that would need to be connected
    // to a cloud storage service like AWS S3, Cloudinary, etc.
    
    // For now, we'll return a placeholder response
    // In production, you should integrate with a cloud storage service
    
    const imageUrl = `/images/blog/${filename}`;
    
    return res.status(200).json({
      success: true,
      data: {
        filename: filename,
        originalName: uploadedFile.originalFilename,
        url: imageUrl,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype
      }
    });

  } catch (error) {
    console.error('Blog upload API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
}