
const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({ message: 'No filename provided' });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
    
    // Security check: ensure the file is within the uploads directory
    if (!filePath.includes(path.join(process.cwd(), 'public', 'uploads'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists and delete it
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      console.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ message: 'File not found' });
      }
      throw error;
    }
    
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};
