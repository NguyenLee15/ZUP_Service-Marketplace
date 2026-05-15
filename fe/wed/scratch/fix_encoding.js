const fs = require('fs');
const path = "d:\\Đồ án tốt nghiệp\\service-marketplace\\fe\\wed\\app\\(main)\\services\\page.tsx";

try {
    let content = fs.readFileSync(path);
    // Remove BOM if exists
    if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
        content = content.slice(3);
    }
    fs.writeFileSync(path, content, { encoding: 'utf8' });
    console.log("Success");
} catch (err) {
    console.error("Error:", err);
}
