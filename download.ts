import https from 'https';
import fs from 'fs';
import path from 'path';

const images = [
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Augusta_National_Golf_Club_-_Hole_13.jpg/1024px-Augusta_National_Golf_Club_-_Hole_13.jpg', name: 'hole13.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Augusta_National_Golf_Club_-_Hole_12.jpg/1024px-Augusta_National_Golf_Club_-_Hole_12.jpg', name: 'hole12.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Augusta_National_Golf_Club_-_Hole_10.jpg/1024px-Augusta_National_Golf_Club_-_Hole_10.jpg', name: 'hole10.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Rory_McIlroy_2014.jpg/800px-Rory_McIlroy_2014.jpg', name: 'rory-profile.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Rory_McIlroy_at_the_2018_BMW_PGA_Championship_%28cropped%29.jpg/1024px-Rory_McIlroy_at_the_2018_BMW_PGA_Championship_%28cropped%29.jpg', name: 'rory-hero.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Masters_Scoreboard.jpg/1024px-Masters_Scoreboard.jpg', name: 'scoreboard.jpg' }
];

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImages() {
  for (const img of images) {
    await new Promise((resolve, reject) => {
      const filePath = path.join(publicDir, img.name);
      const file = fs.createWriteStream(filePath);
      https.get(img.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } }, (response) => {
        if (response.statusCode === 404) {
          console.log(`Not found: ${img.url}`);
          resolve(false);
          return;
        }
        if (response.statusCode !== 200) {
          console.log(`Failed ${img.url} with status ${response.statusCode}`);
          resolve(false);
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded ${img.name}`);
          resolve(true);
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        console.log(`Error: ${err.message}`);
        resolve(false);
      });
    });
    await delay(1500); // 1.5 second delay
  }
}

downloadImages().then(() => console.log('Done.'));
