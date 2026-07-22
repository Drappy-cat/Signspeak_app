const fs = require('fs');

function fixCatch(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\.then\(\(\) => \{\}\)\.catch\(console\.error\)/g, ".catch((e: any) => console.error(e))");
  content = content.replace(/\.catch\(console\.error\)/g, ".catch((e: any) => console.error(e))");
  fs.writeFileSync(file, content);
}

fixCatch('src/app/(tabs)/home.tsx');
fixCatch('src/app/(tabs)/history.tsx');
