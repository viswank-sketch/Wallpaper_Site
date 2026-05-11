const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const category = req.body.category ? req.body.category.replace(/[^a-zA-Z0-9]/g, '_') : 'Other';
        const tempName = req.body.name ? req.body.name.replace(/[^a-zA-Z0-9\s]/g, '_').trim() : 'Unnamed';
        cb(null, category + '--' + tempName + '--' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.get('/api/wallpapers', (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
        return res.json([]);
    }
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read uploads directory' });
        }
        // Filter out non-image files just in case
        const images = files.filter(file => file.match(/\.(jpg|jpeg|png|webp|gif)$/i));
        
        // Sort by newest first based on modified time
        const sortedImages = images.map(file => {
            const parts = file.split('--');
            let category = 'Other';
            let name = 'Unknown';
            if (parts.length >= 3) {
                category = parts[0].replace(/_/g, ' ');
                name = parts[1].replace(/_/g, ' ');
            } else if (parts.length === 2) {
                category = parts[0].replace(/_/g, ' ');
                name = 'Unnamed';
            }
            return {
                filename: file,
                category: category,
                name: name,
                time: fs.statSync(path.join(uploadDir, file)).mtime.getTime()
            };
        })
        .sort((a, b) => b.time - a.time);

        res.json(sortedImages);
    });
});

app.post('/api/upload', upload.single('wallpaper'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded successfully!', filename: req.file.filename });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
