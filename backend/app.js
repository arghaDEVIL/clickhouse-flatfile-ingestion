require('dotenv').config();  // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const { ClickHouse } = require('clickhouse');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(bodyParser.json());
app.use(fileUpload());
app.use(express.static('frontend'));

// Routes setup
const clickhouseRoutes = require('./routes/clickhouse');
const flatfileRoutes = require('./routes/flatfile');
const uploadRoutes = require('./routes/upload');
app.use('/clickhouse', clickhouseRoutes);
app.use('/flatfile', flatfileRoutes);
app.use('/upload', uploadRoutes);

// ClickHouse Client Configuration
const clickHouseUrl = process.env.CLICKHOUSE_URL || 'https://ex9nv0h95b.ap-south-1.aws.clickhouse.cloud:8443';
const username = process.env.CLICKHOUSE_USER || 'default';
const password = process.env.CLICKHOUSE_PASSWORD || 'vbcQI4T8xmgk~';
const jwtToken = process.env.CLICKHOUSE_JWT_TOKEN || '';  // Optional: put your JWT token in .env

// ClickHouse client instance
const clickhouse = new ClickHouse({
  url: clickHouseUrl,
  basicAuth: {
    username: username,
    password: password,
  },
  format: 'json',
});

// Sample API to fetch users from ClickHouse
app.get('/api/getUsers', async (req, res) => {
  try {
    const result = await queryClickHouse('SELECT * FROM users LIMIT 10');
    res.json(result);
  } catch (error) {
    console.error('Error fetching users from ClickHouse:', error);
    res.status(500).json({ error: 'Failed to fetch data from users table' });
  }
});

// Query execution function
async function queryClickHouse(query) {
  try {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    } else {
      headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }

    const response = await axios.post(clickHouseUrl, query, { headers });
    return response.data;
  } catch (error) {
    console.error('Error querying ClickHouse:', error?.response?.data || error.message);
    throw new Error('Error querying ClickHouse');
  }
}

// ✅ Fixed CSV Upload Handler
app.post('/upload', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('No files were uploaded.');
  }

  const uploadedFile = req.files.file;
  const fileData = uploadedFile.data.toString(); // raw CSV string

  try {
    const response = await axios.post(
      `${clickHouseUrl}/?query=INSERT INTO users FORMAT CSV`,
      fileData,
      {
        headers: {
          'Content-Type': 'text/csv',
          'Authorization': jwtToken
            ? `Bearer ${jwtToken}`
            : `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
        }
      }
    );

    res.send('File uploaded and data inserted successfully');
  } catch (error) {
    console.error('Error inserting data from file:', error?.response?.data || error.message);
    res.status(500).send('Error inserting data into ClickHouse');
  }
});

// Start server and verify connection to ClickHouse
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    const result = await clickhouse.query('SELECT 1').toPromise();
    console.log('✅ Connected to ClickHouse!');
    console.log(result);
  } catch (err) {
    console.error('❌ Failed to connect to ClickHouse:', err);
  }
});
const downloadRoute = require('./routes/download');
app.use('/download', downloadRoute);
