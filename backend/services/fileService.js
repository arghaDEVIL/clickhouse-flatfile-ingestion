const fs = require('fs');
const csv = require('csv-parser');
const { insertData } = require('./clickhouseService');

/**
 * Reads a CSV file and returns a preview and cleaned column headers.
 * @param {string} filePath
 * @returns {Promise<{ columns: string[], preview: any[] }>}
 */
const parseCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => {
          const cleaned = header && header.trim();
          console.log(`[DEBUG] Parsed header: "${header}" → "${cleaned}"`);
          return cleaned;
        }
        
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const columns = results[0] ? Object.keys(results[0]) : [];
        const preview = results.slice(0, 10);
        resolve({ columns, preview });
      })
      .on('error', reject);
  });
};

async function handleMappedUpload(filePath, mapping) {
  const rows = await parseCSV(filePath);

  const formatted = rows.map(row => {
    return mapping.map(m => row[m.csvHeader.trim()]);
  });

  await insertData(mapping.map(m => m.clickhouseColumn), formatted);
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header && header.trim()
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

module.exports = {
  parseCsvFile,
  handleMappedUpload
};
