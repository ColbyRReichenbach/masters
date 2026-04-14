import https from 'https';

https.get('https://corsproxy.io/?https://e0.365dm.com/24/04/1600x900/skysports-rory-mcilroy-masters_6514868.jpg', (res) => {
  console.log('Status:', res.statusCode);
});
