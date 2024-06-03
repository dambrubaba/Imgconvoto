const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const heicConvert = require("heic-convert");
const fs = require("fs");
const path = require("path");

const app = express();

// File filter for multer
const fileFilter = (req, file, cb) => {
    const filetypes = /jpg|jpeg|heic/;
    const mimetypes = ["image/jpeg", "image/heic"];
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
    const filePath = req.file.path;
    const outputFilePath = `/tmp/uploads/output.jpeg`;

    try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (ext === ".heic") {
            const inputBuffer = fs.readFileSync(filePath);
            const outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: "JPEG", // Converting HEIC to JPEG
            });
            fs.writeFileSync(outputFilePath, outputBuffer);
        } else {
            await sharp(filePath).jpeg().toFile(outputFilePath);
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
