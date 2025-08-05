
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${sanitizedName}`);
  }
});

const upload = multer({ storage: storage });

// Upload endpoint
app.post('/api/upload', (req, res) => {
  try {
    const { fileName, fileData, originalName, fileType } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Convert base64 to buffer and write file
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    console.log(`File written successfully: ${filePath}`);

    res.status(200).json({ 
      message: 'File uploaded successfully',
      fileName: fileName,
      originalName: originalName,
      path: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Delete endpoint
app.post('/api/delete', (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ message: 'No file path provided' });
    }

    const cleanPath = filePath.replace(/^\//, '');
    const fullPath = path.join(__dirname, 'public', cleanPath);
    
    // Security check
    if (!fullPath.includes(path.join(__dirname, 'public', 'uploads'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      res.status(200).json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
});

// Serve static files from public directory
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`File server running on http://localhost:${port}`);
});
