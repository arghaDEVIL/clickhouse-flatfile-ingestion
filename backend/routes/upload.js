const express = require('express');
const fs = require('fs');
const Papa = require('papaparse');
const router = express.Router();
const axios = require('axios');

// Environment/config values
const CLICKHOUSE_URL = 'https://ex9nv0h95b.ap-south-1.aws.clickhouse.cloud:8443';
const CLICKHOUSE_USER = 'default';
const CLICKHOUSE_PASSWORD = 'vbcQI4T8xmgk~';

// POST /upload
router.post('/', async (req, res) => {
  try {
    const file = req.files.file;
    const mapping = JSON.parse(req.body.mapping);
    const tableName = req.body.tableName;

    // Parse CSV using PapaParse
    const csvContent = file.data.toString('utf8');
    const parsedRaw = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    }).data;

    // Clean and map headers and values
    const cleanData = parsedRaw.map(row => {
      const cleanRow = {};
      for (let rawKey in row) {
        const cleanKey = rawKey.replace(/\r/g, '').trim();
        let value = row[rawKey];
        if (typeof value === 'string') {
          value = value.replace(/\r/g, '').trim();
        }
        cleanRow[cleanKey] = value;
      }
      return cleanRow;
    });

    // Prepare ordered CSV rows according to mapping
    const csvRows = cleanData.map(row => {
      return mapping.map(m => {
        const csvValue = row[m.csvHeader.trim()];
        return typeof csvValue === 'string' && csvValue.includes(',')
          ? `"${csvValue}"` // escape commas if needed
          : csvValue;
      }).join(',');
    });

    // Construct final CSV string (no header)
    const csvPayload = csvRows.join('\n');

    // Build INSERT query
    const columnNames = mapping.map(m => m.clickhouseColumn).join(',');
    const insertQuery = `INSERT INTO ${tableName} (${columnNames}) FORMAT CSV`;

    // Upload to ClickHouse using raw CSV + query param
    await axios.post(
      `${CLICKHOUSE_URL}/?query=${encodeURIComponent(insertQuery)}`,
      csvPayload,
      {
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Basic ${Buffer.from(`${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}`).toString('base64')}`,
        }
      }
    );

    res.json({ success: true, inserted: csvRows.length });

  } catch (err) {
    console.error('Upload error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
