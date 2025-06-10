const fs = require('fs');
const { parse } = require('csv-parse');
const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'dataflow-db',
  password: 'password',
  port: 5432,
});

async function main() {
  await client.connect();

  const lines = fs.readFileSync('A5H006YRPK.csv', 'utf-8').split('\n');
  let station = '';
  let location = '';

  // Find station and location from lines before the header
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().match(/^Hydro/i)) {
      // The next non-empty line is the header, the previous non-empty line is location
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].trim() !== '') {
          const match = lines[j].trim().match(/^([A-Z0-9]+)\s+(.+)$/);
          if (match) {
            station = match[1];
            location = match[2];
          }
          break;
        }
      }
      break;
    }
  }

  const parser = fs
    .createReadStream('A5H006YRPK.csv')
    .pipe(parse({ relax_column_count: true, trim: true }));

  let dataSection = false;

  for await (const row of parser) {
    // Find the header row
    if (!dataSection && row[0] && row[0].trim() === 'Year') {
      dataSection = true;
      continue;
    }
    if (!dataSection) continue;

    // Stop at empty or non-data lines
    if (!row[0] || isNaN(row[0])) continue;

    // Parse fields
    const year = parseInt(row[0]);
    const dateStr = row[1] ? row[1].trim() : '';
    const timeStr = row[2] ? row[2].trim() : '';
    const levelStr = row[3] ? row[3].trim() : '';
    const flowStr = row[4] ? row[4].trim() : '';

    // Parse date and time
    if (!dateStr || !timeStr) continue; // skip if missing required fields
    let date = null, time = null;
    try {
      date = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
    } catch { continue; }
    try {
      time = timeStr;
    } catch { continue; }

    // Parse numbers, handle empty
    const level = levelStr ? parseFloat(levelStr) : null;
    const flow = flowStr ? parseFloat(flowStr) : null;

    // Insert into DB
    await client.query(
      `INSERT INTO river (station, location, year, date, time, level, flow)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [station, location, year, date, time, level, flow]
    );
  }

  await client.end();
  console.log('Import complete.');
}

main().catch(err => {
  console.error(err);
  client.end();
});