const express = require('express');
const { ClickHouse } = require('clickhouse');
const router = express.Router();

// ClickHouse config
const clickhouse = new ClickHouse({
  url: 'https://ex9nv0h95b.ap-south-1.aws.clickhouse.cloud:8443',
  basicAuth: {
    username: 'default',
    password: 'vbcQI4T8xmgk~',
  },
  format: 'csv',
});

// GET /download?table=users
router.get('/', async (req, res) => {
  const table = req.query.table;

  // Validate that the table name is provided
  if (!table) {
    return res.status(400).json({ error: 'Table name is required' });
  }

  try {
    // Build the query with CSVWithNames format to include column headers
    const query = `SELECT * FROM ${table} FORMAT CSVWithNames`;

    // Execute the query and get the stream
    const stream = clickhouse.query(query).stream();

    // Handle the data chunks streamed from ClickHouse
    stream.on('data', (data) => {
      // Check if data is empty or invalid
      if (!data || data.length === 0) {
        console.error('Received empty or invalid data');
        return res.status(500).json({ error: 'No data received from ClickHouse' });
      }
    });

    // Set headers for the CSV download
    res.setHeader('Content-Disposition', `attachment; filename=${table}.csv`);
    res.setHeader('Content-Type', 'text/csv');

    // Pipe the stream to the response, sending the CSV file to the client
    stream.pipe(res);

    // Handle any errors from the stream
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ error: 'Failed to stream data' });
    });

    // Handle stream completion
    stream.on('end', () => {
      console.log('Stream completed successfully');
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;
