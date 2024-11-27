const valgrindService = require('../services/ValgrindService');

class ValgrindController {
    async basicAnalysis(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded.' });
            }

            const result = await valgrindService.analyzeWithCategories(req.file.path);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async compareFiles(req, res) {
        try {
            if (!req.files || req.files.length !== 2) {
                return res.status(400).json({ error: 'Please upload exactly two files.' });
            }

            const comparison = await valgrindService.compareAnalysis(
                req.files[0].path, // older version file
                req.files[1].path  // newer version file
            );
            res.json(comparison);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async customAnalysis(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded.' });
            }

            // Parse the errorTypes from the FormData
            let errorTypes;
            try {
                errorTypes = JSON.parse(req.body.errorTypes || '[]');
            } catch (e) {
                return res.status(400).json({ error: 'Invalid error types format.' });
            }

            if (!Array.isArray(errorTypes) || errorTypes.length === 0) {
                return res.status(400).json({ error: 'Please specify at least one error type to analyze.' });
            }

            const result = await valgrindService.runCustomAnalysis(req.file.path, errorTypes);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ValgrindController();