const fs = require('fs');
const dbPath = 'src/lib/mock-db-store.json';
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

if (!data.users) data.users = [];
if (!data.posts) data.posts = [];
if (!data.comments) data.comments = [];
if (!data.announcements) data.announcements = [];

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
console.log('Updated mock DB successfully.');
