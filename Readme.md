# 🔁 ClickHouse ↔ Flat File Ingestion Tool

A simple web-based data ingestion tool that enables bidirectional data movement between a ClickHouse database and local flat files (CSV). It includes a basic user interface, supports JWT authentication for ClickHouse, and lets users select columns for ingestion.

---

## 📦 Features

- 🔐 Connect to ClickHouse using host, user, and JWT token
- 📤 Ingest flat file (CSV) into ClickHouse
- 📥 Preview and ingest data from ClickHouse to flat file (upcoming)
- ✅ UI to select source type and columns
- 📄 Upload & preview CSV files
- 🧮 Displays number of ingested records

---

## 🛠️ Tech Stack

- **Backend**: Node.js (Express)
- **Frontend**: HTML, CSS, JavaScript
- **Database Client**: ClickHouse client for Node.js
- **File I/O**: `csv-parser`, `express-fileupload`
- **Authentication**: JWT passed via ClickHouse connection

---

## 🚀 Getting Started

### 🔧 Prerequisites

- Node.js installed
- A running ClickHouse instance (local or cloud)
- A `.csv` file to test ingestion

---

### 🧩 Setup Instructions

```bash
git clone https://github.com/yourusername/clickhouse-flatfile-ingestion.git
cd clickhouse-flatfile-ingestion
npm install
