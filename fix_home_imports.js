const fs = require('fs');
let content = fs.readFileSync('src/app/(tabs)/home.tsx', 'utf8');

const importsToAdd = `
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePhoto, saveProfilePhotoLocally } from '../../services/storageService';
import { updateTeacherProfile } from '../../services/teacherService';
import AsyncStorage from '@react-native-async-storage/async-storage';
`;

content = content.replace("import { getTeacherClasses, getTeacherSubjects } from '../../services/teacherService';", "import { getTeacherClasses, getTeacherSubjects, updateTeacherProfile } from '../../services/teacherService';\nimport * as ImagePicker from 'expo-image-picker';\nimport { uploadProfilePhoto, saveProfilePhotoLocally } from '../../services/storageService';\nimport AsyncStorage from '@react-native-async-storage/async-storage';");

// also fix the catch errors:
content = content.replace(/\.catch\(console\.error\)/g, ".then(() => {}).catch(console.error)");

fs.writeFileSync('src/app/(tabs)/home.tsx', content);
