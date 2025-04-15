// Handle ClickHouse Connect (UI Only)
function connectClickHouse() {
  const host = document.getElementById('ch-host').value;
  const user = document.getElementById('ch-user').value;
  const token = document.getElementById('ch-token').value;

  alert(`ClickHouse config saved:
Host: ${host}
User: ${user}
Token: ${token}
(Not actually connecting yet - backend should validate if needed)
  `);
}

// Handle CSV Upload Preview
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

    // ✅ Clean headers
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

    // ✅ Show cleaned header preview
    const preview = document.getElementById('column-preview');
    preview.innerHTML = `
      <h3>Detected Headers</h3>
      <pre>${JSON.stringify(headers, null, 2)}</pre>
    `;
  };

  reader.readAsText(file);
}

// Handle Final Upload
document.getElementById('submitBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('csvUpload');
  const file = fileInput.files[0];
  if (!file) {
    alert('No CSV file selected.');
    return;
  }

  const mappings = [];
  document.querySelectorAll('#mappingContainer input').forEach(input => {
    mappings.push({
      clickhouseColumn: input.value.trim(),
      csvHeader: input.dataset.csvheader.trim()
    });
  });

  const tableName = prompt("Enter target table name in ClickHouse:");
  if (!tableName) {
    alert('Table name is required.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('mapping', JSON.stringify(mappings));
  formData.append('tableName', tableName);

  const status = document.getElementById('status');
  status.textContent = 'Uploading...';

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    if (result.success) {
      status.textContent = `✅ Upload successful! Inserted ${result.inserted} rows.`;
    } else {
      status.textContent = `❌ Upload failed.`;
    }
  } catch (err) {
    console.error(err);
    status.textContent = '❌ Error uploading file.';
  }
});
function downloadCSV() {
  const tableName = document.getElementById('exportTableName').value;
  if (!tableName) return alert('Please enter a table name.');
  window.location.href = `/download?table=${tableName}`;
}
