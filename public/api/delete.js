
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ message: 'No file path provided' });
    }

    // Remove leading slash and ensure it's in uploads directory
    const cleanPath = filePath.replace(/^\//, '');
    const fullPath = path.join(process.cwd(), 'public', cleanPath);
    
    // Security check: ensure the file is within the uploads directory
    if (!fullPath.includes(path.join(process.cwd(), 'public', 'uploads'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete the file
    fs.unlinkSync(fullPath);
    
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};
