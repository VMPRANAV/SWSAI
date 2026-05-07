const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { handleUpload } = require('../controllers/upload.controller');


router.post('/upload', upload.array('files', 20), handleUpload);

module.exports = router;