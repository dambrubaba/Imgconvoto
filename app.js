const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/convert', upload.single('image'), async (req, res) => {
  const format = req.body.format; // e.g., 'png', 'jpeg', 'webp'
  const outputFilePath = `uploads/output.${format}`;

  try {
    await sharp(req.file.path)
      .toFormat(format)
      .toFile(outputFilePath);

    res.download(outputFilePath, (err) => {
      if (err) {
        console.error(err);
      }
      fs.unlinkSync(req.file.path); // Delete the uploaded file
      fs.unlinkSync(outputFilePath); // Delete the output file
    });
  } catch (error) {
    res.status(500).send('Error processing image');
  }
});

app.listen(3000, () => {
  console.log('Server started');
});
