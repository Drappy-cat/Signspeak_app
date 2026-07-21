const https = require('https');
const fs = require('fs');
const readline = require('readline');

const url = 'https://raw.githubusercontent.com/suryavip/daftar-sekolah-indonesia/master/daftar-sekolah.sql';
const outPath = 'daftar_sekolah_final.csv';

const out = fs.createWriteStream(outPath);
out.write('school_name,school_type,address\n');

console.log('Downloading and processing SQL data from Github...');

https.get(url, (res) => {
  const rl = readline.createInterface({
    input: res,
    crlfDelay: Infinity
  });

  let count = 0;

  rl.on('line', (line) => {
    // Check if line looks like an INSERT value line: ('...', '...', ...)
    if (line.startsWith('(') && !line.includes('VALUES')) {
      const parts = line.split("', '");
      if (parts.length >= 12) {
        const prov = parts[1].trim();
        const kab = parts[3].trim();
        const kec = parts[5].trim();
        const nama = parts[8].trim();
        const bentuk = parts[9].trim();
        let jalan = parts[11].trim();

        // Valid school types
        const validTypes = ['SD', 'SMP', 'SMA', 'SMK', 'SLB'];
        if (validTypes.includes(bentuk)) {
          // Construct full address
          let alamatFull = '';
          if (jalan && jalan !== '-') {
            alamatFull += jalan + ', ';
          }
          alamatFull += `${kec}, ${kab}, ${prov}`;
          
          // Escape quotes for CSV
          const csvNama = `"${nama.replace(/"/g, '""')}"`;
          const csvAlamat = `"${alamatFull.replace(/"/g, '""')}"`;

          out.write(`${csvNama},${bentuk},${csvAlamat}\n`);
          count++;
        }
      }
    }
  });

  rl.on('close', () => {
    out.end();
    console.log(`Successfully generated ${outPath} with ${count} schools!`);
  });
}).on('error', (err) => {
  console.error('Error fetching data:', err);
});
