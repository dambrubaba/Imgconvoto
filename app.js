const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const heicConvert = require('heic-convert');
const fs = require('fs');
const path = require('path');

const app = express();

// Set up multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, fileFilter: fileFilter });

// File filter for multer
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp|heic|heif/;
    const mimetypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/heic',
        'image/heif'
    ];
    const mimetype = mimetypes.includes(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images Only!'));
    }
};

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/convert', upload.single('image'), async (req, res) => {
    const format = req.body.format; // jpeg, png, webp, heic, etc.
    const file = req.file;
    const outputFilePath = `uploads/output.${format}`;

    try {
        if (!file) {
            throw new Error('No file uploaded.');
        }

        const inputBuffer = file.buffer;
        let outputBuffer;

        if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
            outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: format.toUpperCase() // Converting HEIC to the desired format
            });
        } else {
            outputBuffer = await sharp(inputBuffer).toFormat(format).toBuffer();
        }

        // At this point, outputBuffer contains the converted image
        // You can now send this buffer back to the client, save it to a database, etc.
        // For example, to send the image back to the client:
        res.type(`image/${format}`);
        res.send(outputBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing image');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});