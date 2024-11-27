const express = require('express');
const router = express.Router();
const valgrindController = require('../controllers/ValgrindController');
const upload = require('../config/multerConfig');

// Basic analysis endpoint
router.post('/basic-analysis', upload.single('file'), valgrindController.basicAnalysis);

// Compare two files endpoint (first file: older version, second file: newer version)
router.post('/compare', upload.array('files', 2), valgrindController.compareFiles);

// Custom analysis with specific error types
router.post('/custom-analysis', 
    upload.single('file'),
    express.json(),
    valgrindController.customAnalysis
);

module.exports = router;