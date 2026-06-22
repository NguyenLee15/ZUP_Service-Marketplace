const fs = require('fs');
const path = require('path');

const files = [
  'fe/customer-mobile/app/chatbot.tsx',
  'fe/customer-mobile/app/notifications.tsx',
  'fe/customer-mobile/app/(tabs)/bookings.tsx',
  'fe/customer-mobile/app/(tabs)/chat.tsx',
  'fe/customer-mobile/app/(tabs)/index.tsx',
  'fe/customer-mobile/app/(tabs)/search.tsx',
  'fe/customer-mobile/app/chat-room/[id]/index.tsx',
  'fe/customer-mobile/app/profile/favorites.tsx',
  'fe/customer-mobile/app/provider/[id]/index.tsx',
  'fe/mobile/app/notifications.tsx',
  'fe/mobile/app/services.tsx',
  'fe/mobile/app/(tabs)/bookings.tsx',
  'fe/mobile/app/(tabs)/chat.tsx',
  'fe/mobile/app/(tabs)/wallet.tsx',
  'fe/mobile/app/chat-room/[id].tsx',
  'fe/mobile/app/service/[id]/reviews.tsx'
];

for (const f of files) {
  const fullPath = path.join(__dirname, '..', f);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const filtered = lines.filter(line => !line.includes('estimatedItemSize='));
    fs.writeFileSync(fullPath, filtered.join('\n'), 'utf8');
    console.log('Fixed', f);
  }
}
