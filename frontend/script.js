// ClickHouse connect (for demo purposes)
function connectClickHouse() {
  const host = document.getElementById('ch-host').value;
  const user = document.getElementById('ch-user').value;
  const token = document.getElementById('ch-token').value;

  alert(`ClickHouse config saved:
Host: ${host}
User: ${user}
Token: ${token}
(Not actually connecting - set in .env or backend)`);
}

// Load ClickHouse tables for join feature
async function loadClickHouseTables() {
  try {
    const res = await fetch('/clickhouse/tables');
    const tables = await res.json();
    const select = document.getElementById('joinTables');
    select.innerHTML = ''; // Clear previous options

    tables.forEach(table => {
      const option = document.createElement('option');
      option.value = table;
      option.textContent = table;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to fetch ClickHouse tables:', err);
    document.getElementById('status').textContent = '❌ Could not load ClickHouse tables.';
  }
}

window.onload = () => {
  loadClickHouseTables();
};

// CSV preview logic
document.getElementById('csvUpload').addEventListener('change', handleCSVUpload);

async function handleCSVUpload(e) {
  const file = e.target.files[0];
  if (!file) {
    alert('Please upload a CSV file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split('\n');
    const rawHeaders = lines[0].split(',');

    const headers = rawHeaders.map(h => h.replace(/\r/g, '').trim());

    const mappingContainer = document.getElementById('mappingContainer');
    mappingContainer.innerHTML = '';

    headers.forEach(header => {
      const div = document.createElement('div');
      div.innerHTML = `
        <label>Map CSV Column "<b>${header}</b>" to ClickHouse Column:</label>
        <input type="text" value="${header}" data-csvheader="${header}" />
      `;
      mappingContainer.appendChild(div);
    });

    const preview = document.getElementById('column-preview');
    preview.innerHTML = `
      <h3>Detected Headers</h3>
      <pre>${JSON.stringify(headers, null, 2)}</pre>
    `;
  };

  reader.readAsText(file);
}

// CSV upload to ClickHouse
document.getElementById('submitBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('csvUpload');
  const file = fileInput.files[0];
  if (!file) return alert('No CSV file selected.');

  const mappings = [];
  document.querySelectorAll('#mappingContainer input').forEach(input => {
    mappings.push({
      clickhouseColumn: input.value.trim(),
      csvHeader: input.dataset.csvheader.trim()
    });
  });

  const tableName = document.getElementById('clickhouseTable').value.trim();
  if (!tableName) return alert('Table name is required.');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('mapping', JSON.stringify(mappings));
  formData.append('tableName', tableName);

  const xhr = new XMLHttpRequest();
  const status = document.getElementById('status');
  const progressWrapper = document.getElementById('uploadProgressWrapper');
  const progressBar = document.getElementById('uploadProgress');

  progressWrapper.style.display = 'block';
  progressBar.value = 0;

  xhr.upload.onprogress = function (e) {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      progressBar.value = percent;
    }
  };

  xhr.onload = function () {
    progressWrapper.style.display = 'none';
    if (xhr.status === 200) {
      const res = JSON.parse(xhr.responseText);
      status.textContent = `✅ Upload successful! Inserted ${res.inserted} rows.`;
    } else {
      status.textContent = '❌ Upload failed.';
    }
  };

  xhr.onerror = function () {
    progressWrapper.style.display = 'none';
    status.textContent = '❌ Error uploading file.';
  };

  xhr.open('POST', '/upload');
  xhr.send(formData);
});


// Download ClickHouse table as CSV
function downloadCSV() {
  const tableName = document.getElementById('exportTableName').value;
  if (!tableName) return alert('Please enter a table name.');
  window.location.href = `/download?table=${tableName}`;
}

// Handle multi-table join ingestion
async function runJoinQuery() {
  const selectedTables = Array.from(document.getElementById('joinTables').selectedOptions).map(opt => opt.value);
  const joinCondition = document.getElementById('joinCondition').value.trim();
  const targetTable = document.getElementById('joinTargetTable').value.trim();

  const status = document.getElementById('status');

  if (selectedTables.length < 2) {
    alert("Please select at least two tables to join.");
    return;
  }

  if (!joinCondition || !targetTable) {
    alert("Please enter both a JOIN condition and a target table name.");
    return;
  }

  status.textContent = 'Running join...';

  try {
    const res = await fetch('/clickhouse/join-ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tables: selectedTables,
        joinCondition,
        targetTable
      })
    });

    const result = await res.json();
    if (result.success) {
      status.textContent = `✅ ${result.message}`;
    } else {
      status.textContent = `❌ Join failed: ${result.error || 'Unknown error'}`;
    }
  } catch (err) {
    console.error('Join ingestion failed:', err);
    status.textContent = '❌ Failed to ingest join result.';
  }
}
function downloadCSV() {
  const tableName = document.getElementById('exportTableName').value;
  if (!tableName) return alert('Please enter a table name.');

  const status = document.getElementById('status');
  status.textContent = '⏳ Preparing download...';

  // Start download
  window.location.href = `/download?table=${tableName}`;

  // Optional: Clear message after few seconds
  setTimeout(() => {
    status.textContent = '';
  }, 5000);
}
