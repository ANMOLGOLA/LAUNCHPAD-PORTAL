const fs = require('fs');
const dbPath = 'src/lib/mock-db-store.json';
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const eventId = '69c7524b-5450-40dc-b03d-3f874e86fa16';
const eventIndex = data.events.findIndex(e => e.id === eventId);
if (eventIndex !== -1) {
  data.events[eventIndex].template_fields = {
    name: {
      x: 50,
      y: 47,
      size: 26,
      color: '#1a1a1a'
    },
    date: {
      x: 21,
      y: 74.5,
      size: 16,
      color: '#1a1a1a'
    }
  };
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  console.log('Updated template_fields successfully.');
} else {
  console.log('Event not found!');
}
