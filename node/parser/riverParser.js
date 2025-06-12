const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Client } = require('pg');

// Import connection pool config
const pool = require('../db');

// Path to data folder (relative to this file)
const DATA_FOLDER = path.join(__dirname, '..', '..', 'data');

// Safe parse function for level/flow
function safeParseNumber(value) {
  if (!value) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

async function parseCSVFile(filePath) {
  const client = new Client({
    user: pool.user,
    host: pool.host,
    database: pool.database,
    password: pool.password,
    port: pool.port,
  });

  await client.connect();
  console.log(`🔍 Parsing file: ${filePath}`);

  let station = '';
  let location = '';

  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

  // Extract station and location before the "Hydro" header
  for (let i = 0; i < lines.length; i++) {
    if (/^Hydro/i.test(lines[i].trim())) {
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

  console.log(`📍 Found station: ${station}, location: ${location}`);

  const parser = fs.createReadStream(filePath).pipe(
    parse({ relax_column_count: true, trim: true })
  );

  let dataSection = false;
  let insertedCount = 0;
  let skippedCount = 0;

  for await (const row of parser) {
    if (!dataSection && row[0]?.replace('\uFEFF', '').trim() === 'Year') {
      console.log('✅ Data section found — starting to parse rows...');
      dataSection = true;
      continue;
    }
    if (!dataSection || !row[0] || isNaN(row[0])) continue;

    const year = parseInt(row[0]);
    const dateStr = row[1]?.trim();
    const timeStr = row[2]?.trim();
    const levelStr = row[3]?.trim();
    const flowStr = row[4]?.trim();

    if (!dateStr || !timeStr) continue;

    let date;
    try {
      date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    } catch {
      console.warn(`⚠️ Invalid date: ${dateStr}`);
      continue;
    }

    const level = safeParseNumber(levelStr);
    const flow = safeParseNumber(flowStr);

    try {
      const existing = await client.query(
        'SELECT 1 FROM river WHERE station = $1 AND date = $2 AND time = $3',
        [station, date, timeStr]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping duplicate: ${station} - ${date} ${timeStr}`);
        skippedCount++;
        continue;
      }

      await client.query(
        `INSERT INTO river (station, location, year, date, time, level, flow)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [station, location, year, date, timeStr, level, flow]
      );

      insertedCount++;
    } catch (err) {
      console.error(`❌ Error inserting row: ${JSON.stringify(row)}`, err.message);
    }
  }

  await client.end();
  console.log(`📄 Finished ${filePath}: ${insertedCount} inserted, ${skippedCount} skipped.`);
}

async function main() {
  try {
    console.log('📁 Reading data folder...');
    const files = fs.readdirSync(DATA_FOLDER).filter(file =>
      file.toLowerCase().endsWith('.csv')
    );

    if (files.length === 0) {
      console.log(`⚠️ No CSV files found in ${DATA_FOLDER}`);
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

// Export for use in server.js
module.exports = { parseCSVFile, main };

// If run directly: node riverParser.js
if (require.main === module) {
  main();
}
