const fs = require('fs');

let historyContent = fs.readFileSync('src/app/(tabs)/history.tsx', 'utf8');
historyContent = historyContent.replace(/\.catch\(\(e: any\) => console\.error\(e\)\)/g, "");
historyContent = historyContent.replace(/\.catch\(console\.error\)/g, "");
fs.writeFileSync('src/app/(tabs)/history.tsx', historyContent);

let homeContent = fs.readFileSync('src/app/(tabs)/home.tsx', 'utf8');
homeContent = homeContent.replace(/\.catch\(\(e: any\) => console\.error\(e\)\)/g, "");
homeContent = homeContent.replace(/\.catch\(console\.error\)/g, "");

// Fix borderWidth specified more than once
homeContent = homeContent.replace(/borderWidth: 3, borderColor: hc \? '#3b82f6' : '#bfdbfe'\n.*borderWidth: 2, borderColor: '#ffffff',/g, "borderWidth: 2, borderColor: '#ffffff',");

fs.writeFileSync('src/app/(tabs)/home.tsx', homeContent);

// Fix SmartDropdown.tsx
let sdContent = fs.readFileSync('src/components/SmartDropdown.tsx', 'utf8');
sdContent = sdContent.replace(/NodeJS\.Timeout/g, "ReturnType<typeof setTimeout>");
sdContent = sdContent.replace(/setTimeout\(\(\) => \{/, "setTimeout(() => {\n      //");
fs.writeFileSync('src/components/SmartDropdown.tsx', sdContent);

// Fix schoolService.ts
let schoolContent = fs.readFileSync('src/services/schoolService.ts', 'utf8');
schoolContent = schoolContent.replace(/id: schoolId,\n/g, "");
schoolContent = schoolContent.replace(/npsn: "Unknown",\n/g, "");
schoolContent = schoolContent.replace(/status: "Active",\n/g, "");
fs.writeFileSync('src/services/schoolService.ts', schoolContent);

// Fix teacherService.ts
let teacherContent = fs.readFileSync('src/services/teacherService.ts', 'utf8');
teacherContent = teacherContent.replace(/id: teacherId,\n/g, "");
teacherContent = teacherContent.replace(/photo_url: "default.png",\n/g, "");
teacherContent = teacherContent.replace(/created_at: new Date\(\)\.toISOString\(\),\n/g, "");
fs.writeFileSync('src/services/teacherService.ts', teacherContent);
