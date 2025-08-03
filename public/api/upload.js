
// This is a simple file upload handler for development
// In production, you would want to use a proper backend service

const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    form.keepExtensions = true;

    // Ensure uploads directory exists
    if (!fs.existsSync(form.uploadDir)) {
      fs.mkdirSync(form.uploadDir, { recursive: true });
    }

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(500).json({ message: 'Upload failed', error: err.message });
      }

      const file = files.file;
      const fileName = fields.fileName;

      if (!file || !fileName) {
        return res.status(400).json({ message: 'No file or filename provided' });
      }

      const newPath = path.join(form.uploadDir, fileName);
      
      // Move file to final location
      fs.rename(file.filepath, newPath, (renameErr) => {
        if (renameErr) {
          console.error('File move error:', renameErr);
          return res.status(500).json({ message: 'File move failed', error: renameErr.message });
        }

        res.status(200).json({ 
          message: 'File uploaded successfully',
          fileName: fileName,
          path: `/uploads/${fileName}`
        });
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};
