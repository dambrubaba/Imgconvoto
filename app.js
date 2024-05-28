const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const heicConvert = require('heic-convert');
const fs = require('fs');
const path = require('path');

const app = express();

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

const upload = multer({ 
    dest: 'uploads/',
    fileFilter: fileFilter
});

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/convert', upload.single('image'), async (req, res) => {
    const format = req.body.format; // jpeg, png, webp, heic, etc.
    const filePath = req.file.path;
    const outputFilePath = `uploads/output.${format}`;

    try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (ext === '.heic' || ext === '.heif') {
            const inputBuffer = fs.readFileSync(filePath);
            const outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: format.toUpperCase() // Converting HEIC to the desired format
            });
            fs.writeFileSync(outputFilePath, outputBuffer);
        } else if (format === 'heic') {
            const inputBuffer = fs.readFileSync(filePath);
            const outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: 'HEIC' // Converting to HEIC
            });
            fs.writeFileSync(outputFilePath, outputBuffer);
        } else {
            await sharp(filePath).toFormat(format).toFile(outputFilePath);
        }

        res.download(outputFilePath, (err) => {
            if (err) {
                console.error(err);
            }
            fs.unlinkSync(filePath); // Delete the uploaded file
            fs.unlinkSync(outputFilePath); // Delete the output file
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing image');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});