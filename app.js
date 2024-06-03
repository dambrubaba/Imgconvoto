const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const heicConvert = require("heic-convert");
const fs = require("fs");
const path = require("path");

const app = express();

// File filter for multer
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|heic|heif/;
    const mimetypes = ["image/jpeg", "image/jpg", "image/heic", "image/heif"];
    const mimetype = mimetypes.includes(file.mimetype);
    const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase(),
    );
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Error: Images Only!"));
    }
};

// Set up multer with file filter
const upload = multer({
    dest: "/tmp/uploads/", // Use the /tmp directory for uploads
    fileFilter: fileFilter,
});

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.post("/convert", upload.single("image"), async (req, res) => {
    const format = "jpeg"; // Always convert to jpeg
    const filePath = req.file.path;
    const outputFilePath = `uploads/output.${format}`;

    try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (ext === ".heic" || ext === ".heif") {
            const inputBuffer = fs.readFileSync(filePath);
            const outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: "JPEG", // Converting HEIC to JPEG
            });
            fs.writeFileSync(outputFilePath, outputBuffer);
        } else if (ext === ".jpg" || ext === ".jpeg") {
            await sharp(filePath).toFormat(format).toFile(outputFilePath);
        } else {
            throw new Error("Unsupported file type.");
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
        res.status(500).send("Error processing image");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
