const fs = require('fs');
const path = require('path');

const fixes = [
  { file: 'fe/customer-mobile/app/(tabs)/bookings.tsx', size: 180 },
  { file: 'fe/customer-mobile/app/(tabs)/chat.tsx', size: 80 },
  { file: 'fe/customer-mobile/app/(tabs)/index.tsx', size: 150 },
  { file: 'fe/customer-mobile/app/(tabs)/search.tsx', size: 150 },
  { file: 'fe/customer-mobile/app/chat-room/[id]/index.tsx', size: 80 },
  { file: 'fe/customer-mobile/app/chatbot.tsx', size: 60 },
  { file: 'fe/customer-mobile/app/notifications.tsx', size: 100 },
  { file: 'fe/customer-mobile/app/profile/favorites.tsx', size: 150 },
  { file: 'fe/customer-mobile/app/provider/[id]/index.tsx', size: 250 },
  { file: 'fe/mobile/app/chat-room/[id].tsx', size: 60 },
  { file: 'fe/mobile/app/(tabs)/wallet.tsx', size: 80 },
  { file: 'fe/mobile/app/(tabs)/chat.tsx', size: 80 },
  { file: 'fe/mobile/app/(tabs)/bookings.tsx', size: 180 },
  { file: 'fe/mobile/app/services.tsx', size: 150 },
  { file: 'fe/mobile/app/notifications.tsx', size: 100 }
];

const basePath = path.join(__dirname, '../../../');

fixes.forEach(({ file, size }) => {
  const fullPath = path.join(basePath, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Regex to find <FlashList that doesn't have estimatedItemSize
  if (content.includes('<FlashList') && !content.includes('estimatedItemSize=')) {
    content = content.replace(/<FlashList/, `<FlashList\n        estimatedItemSize={${size}}`);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed ${file}`);
  } else {
    console.log(`Skipped ${file} (already has estimatedItemSize or no FlashList)`);
  }
});
