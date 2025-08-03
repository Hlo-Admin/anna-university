
const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fileName, fileData, originalName, fileType } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Convert base64 to buffer and write file
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    console.log(`File written successfully: ${filePath}`);

    res.status(200).json({ 
      message: 'File uploaded successfully',
      fileName: fileName,
      originalName: originalName,
      path: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('Write file error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};
