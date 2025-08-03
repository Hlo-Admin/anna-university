
const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Check if uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch {
      return res.status(200).json([]);
    }

    const files = await fs.readdir(uploadsDir);
    const fileList = [];

    for (const file of files) {
      if (file === '.gitkeep') continue;
      
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);
      
      fileList.push({
        fileName: file,
        originalName: file.split('_').slice(1).join('_'), // Remove timestamp prefix
        uploadedAt: stats.birthtime.toISOString(),
        url: `/uploads/${file}`,
        size: stats.size
      });
    }

    res.status(200).json(fileList);
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ message: 'Failed to list files', error: error.message });
  }
};
