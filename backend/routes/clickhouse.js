const express = require('express');
const router = express.Router();
const { ClickHouse } = require('clickhouse');
const { testConnection, insertRows } = require('../services/clickhouseService');

// ✅ ClickHouse Client Setup
const clickhouse = new ClickHouse({
  url: process.env.CLICKHOUSE_URL || 'https://ex9nv0h95b.ap-south-1.aws.clickhouse.cloud:8443',
  basicAuth: {
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || 'your-password',
  },
  format: 'json',
});

// 🔌 Test ClickHouse Connection
router.post('/connect', async (req, res) => {
  try {
    await testConnection();
    res.json({ success: true, message: 'Connected successfully!' });
  } catch (err) {
    console.error('Connection error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📤 Upload CSV data into ClickHouse
router.post('/upload', async (req, res) => {
  const { table, columns } = req.body;
  const file = req.files?.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'CSV file required' });
  }

  const data = file.data.toString();
  const rows = data
    .split('\n')
    .map(r => r.split(','))
    .filter(r => r.length === columns.length);

  if (rows.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid data found in the CSV' });
  }

  try {
    await insertRows(table, columns, rows);
    res.json({ success: true, message: `${rows.length} rows inserted successfully`, inserted: rows.length });
  } catch (err) {
    console.error('Insertion error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📥 Fetch table column info
router.get('/columns', async (req, res) => {
  const { table } = req.query;

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

// 🧾 Get available table list for dropdown
router.get('/tables', async (req, res) => {
  try {
    const result = await clickhouse.query('SHOW TABLES').toPromise();
    const tableNames = result.map(row => Object.values(row)[0]); // Extract table names
    res.json(tableNames);
  } catch (err) {
    console.error('Failed to fetch tables:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch tables' });
  }
});

// 🔄 Multi-Table Join Ingestion
router.post('/join-ingest', async (req, res) => {
  const { tables, joinCondition, targetTable } = req.body;

  if (!tables || tables.length < 2 || !joinCondition || !targetTable) {
    return res.status(400).json({ success: false, error: 'Missing tables, condition, or targetTable' });
  }

  try {
    const aliases = ['a', 'b', 'c', 'd', 'e', 'f'];
    const tableJoins = tables.map((tbl, idx) => `${tbl} AS ${aliases[idx]}`);

    let query = `INSERT INTO ${targetTable} SELECT * FROM ${tableJoins[0]}`;
    for (let i = 1; i < tables.length; i++) {
      query += ` JOIN ${tableJoins[i]} ON ${joinCondition}`;
    }

    console.log("Running JOIN query:", query);
    await clickhouse.query(query).toPromise();

    res.json({ success: true, message: 'Join executed and ingested into target table.' });
  } catch (err) {
    console.error('Join error:', err);
    res.status(500).json({ success: false, error: 'Failed to execute join query' });
  }
});

module.exports = router;
