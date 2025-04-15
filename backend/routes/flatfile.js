// backend/routes/flatfile.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fileService = require('../services/fileService');
const clickhouseService = require('../services/clickhouseService');

router.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.csvFile) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const file = req.files.csvFile;
    const tableName = req.body.table || 'your_table'; // fallback
    const mapping = JSON.parse(req.body.mapping || '[]');

    if (mapping.length === 0) {
      return res.status(400).json({ message: 'No column mapping provided' });
    }

    const uploadPath = path.join(__dirname, '../../data', file.name);
    await file.mv(uploadPath);

    // Parse full CSV
    const parsedRows = await fileService.parseCsvFile(uploadPath);

    // Build rows based on mapping
    const columns = mapping.map(m => m.clickhouseColumn);
    const rows = parsedRows.map(row =>
      mapping.map(m => row[m.csvHeader] || '')
    );

    await clickhouseService.insertRows(tableName, columns, rows);

    res.json({ message: 'Rows inserted into ClickHouse', rowCount: rows.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

module.exports = router;


// 🆕 CSV Preview Endpoint
router.post('/preview', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.file;
    const uploadPath = path.join(__dirname, '../../data', file.name);
    await file.mv(uploadPath);

    const parsed = await fileService.parseCsvFile(uploadPath);
    res.json(parsed); // { columns: [...], preview: [...] }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Preview failed', error: err.message });
  }
});

module.exports = router;

