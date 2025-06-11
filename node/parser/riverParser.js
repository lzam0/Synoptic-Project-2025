const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Client } = require('pg');

// Import connection pool
const pool = require('../db');

// Path to data folder
const DATA_FOLDER = path.join(__dirname, '../../data');

async function parseCSVFile(filePath) {
  const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

  await client.connect();

  console.log(`Parsing file: ${filePath}`);

  let station = '';
  let location = '';

  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

 // Try to find station and location info before "Hydro" header
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().match(/^Hydro/i)) {
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].trim()) {
          const parts = lines[j].trim().split(/\s+/);
          if (parts.length > 1) {
            station = parts[0];
            location = parts.slice(1).join(' ');
          }
          break;
        }
      }
      break;
    }
  }

  console.log(`Found station: ${station}, location: ${location}`);

  const parser = fs.createReadStream(filePath).pipe(
    parse({ relax_column_count: true, trim: true })
  );

  let dataSection = false;

  for await (const row of parser) {
    if (!dataSection && row[0] && row[0].trim() === 'Year') {
      dataSection = true;
      continue;
    }
    if (!dataSection) continue;

    if (!row[0] || isNaN(row[0])) continue;

    const year = parseInt(row[0]);
    const dateStr = row[1]?.trim();
    const timeStr = row[2]?.trim();
    const levelStr = row[3]?.trim();
    const flowStr = row[4]?.trim();

    if (!dateStr || !timeStr) continue;

    let date = null;
    try {
      // Format YYYYMMDD -> ISO date
      date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    } catch {
      console.warn(`Invalid date: ${dateStr}`);
      continue;
    }

    const level = levelStr ? parseFloat(levelStr) : null;
    const flow = flowStr ? parseFloat(flowStr) : null;

    // Optional: Check for existing entry
    const existing = await client.query(
      `SELECT 1 FROM river WHERE station = $1 AND date = $2 AND time = $3`,
      [station, date, timeStr]
    );

    if (existing.rows.length > 0) {
      // console.log(`Skipping duplicate: ${station} - ${date} ${timeStr}`);
      continue;
    }

    // Insert into DB
    try {
      await client.query(
        `INSERT INTO river (station, location, year, date, time, level, flow)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [station, location, year, date, timeStr, level, flow]
      );
    } catch (err) {
      console.error(`Error inserting row: ${row}`, err.message);
    }
  }

  await client.end();
}

async function main() {
  try {
    const files = fs.readdirSync(DATA_FOLDER).filter(file =>
      file.toLowerCase().endsWith('.csv')
    );

    if (files.length === 0) {
      console.log(`No CSV files found in ${DATA_FOLDER}`);
      return;
    }

    for (const file of files) {
      const filePath = path.join(DATA_FOLDER, file);
      await parseCSVFile(filePath);
    }

    console.log('✅ All CSV files imported successfully.');
  } catch (err) {
    console.error('❌ Error reading directory:', err.message);
  }
}

module.exports = parseCSVFile;
