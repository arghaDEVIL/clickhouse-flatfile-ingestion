const { createClient } = require('@clickhouse/client');
require('dotenv').config();

const clickhouse = createClient({
  host: process.env.CLICKHOUSE_URL,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_TOKEN,
});

/**
 * Test ClickHouse connection
 */
const testConnection = async () => {
  try {
    await clickhouse.ping();
    console.log('✅ Connected to ClickHouse');
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    throw err;
  }
};

/**
 * Escapes single quotes in values
 */
const escapeValue = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/'/g, "''").trim();
};

/**
 * Insert rows into ClickHouse table
 * @param {string} table - Target table name
 * @param {Array<string>} columns - Column names
 * @param {Array<Array<string>>} rows - Row data as 2D array
 */
const insertRows = async (table, columns, rows) => {
  try {
    const values = rows.map(row =>
      `(${row.map(v => `'${escapeValue(v)}'`).join(',')})`
    ).join(',');

    const query = `INSERT INTO ${table} (${columns.join(',')}) VALUES ${values}`;

    await clickhouse.command({ query }).catch(err => { throw err; });
    console.log(`✅ Inserted ${rows.length} rows into ${table}`);
  } catch (err) {
    console.error('❌ Insert failed:', err.message);
    throw err;
  }
};

module.exports = {
  clickhouse,
  testConnection,
  insertRows,
};
