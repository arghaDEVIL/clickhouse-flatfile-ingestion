// backend/routes/clickhouse.js
const express = require('express');
const router = express.Router();
const { testConnection, insertRows } = require('../services/clickhouseService');

router.post('/connect', async (req, res) => {
  try {
    await testConnection();
    res.json({ success: true, message: 'Connected successfully!' });
  } catch (err) {
    console.error('Connection error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Improved /upload route
router.post('/upload', async (req, res) => {
  const { table, columns } = req.body;
  const file = req.files?.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'CSV file required' });
  }

  const data = file.data.toString();
  
  // Parse CSV data
  const rows = data
    .split('\n')
    .map(r => r.split(','))
    .filter(r => r.length === columns.length); // basic row sanity check

  // Additional check for empty or invalid CSV data
  if (rows.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid data found in the CSV' });
  }

  console.log(`Parsed ${rows.length} rows`);

  try {
    await insertRows(table, columns, rows);
    res.json({ success: true, message: `${rows.length} rows inserted successfully` });
  } catch (err) {
    console.error('Insertion error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET route to fetch columns from a table
router.get('/columns', async (req, res) => {
  const { table } = req.query; // Assuming table name is passed as query parameter
  
  if (!table) {
    return res.status(400).json({ success: false, message: 'Table name is required' });
  }

  try {
    const result = await clickhouse.query({
      query: `DESCRIBE TABLE ${table}`,
      format: 'JSONEachRow'
    }).then(r => r.json());

    const columns = result.map(col => ({ name: col.name, type: col.type }));
    res.json({ success: true, columns });
  } catch (err) {
    console.error('Error fetching columns:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
