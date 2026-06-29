const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

// Extract config from .env or fallback to defaults
function getEnvConfig() {
  const envPath = path.join(__dirname, '.env');
  const config = {
    apiKey: "AIzaSyDInHeTU4IWo4kVVsho62WcK6Vg9f83vfg",
    authDomain: "khmergo-ba0b0.firebaseapp.com",
    projectId: "khmergo-ba0b0",
    storageBucket: "khmergo-ba0b0.firebasestorage.app",
    messagingSenderId: "563133852511",
    appId: "1:563133852511:web:f5b7f2aebeab097a3064ea",
    measurementId: "G-LTBGS11WXY"
  };

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const cleanLine = line.replace('\r', '').trim();
      const match = cleanLine.match(/^EXPO_PUBLIC_FIREBASE_([A-Z0-9_]+)=(.*)$/);
      if (match) {
        const keyName = match[1];
        const val = match[2].trim();
        if (keyName === 'API_KEY') config.apiKey = val;
        if (keyName === 'AUTH_DOMAIN') config.authDomain = val;
        if (keyName === 'PROJECT_ID') config.projectId = val;
        if (keyName === 'STORAGE_BUCKET') config.storageBucket = val;
        if (keyName === 'MESSAGING_SENDER_ID') config.messagingSenderId = val;
        if (keyName === 'APP_ID') config.appId = val;
        if (keyName === 'MEASUREMENT_ID') config.measurementId = val;
      }
    }
  }
  return config;
}

const firebaseConfig = getEnvConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Helper to convert Firestore Timestamps to ISO strings
function convertTimestamps(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }
  
  if (obj.seconds !== undefined && obj.nanoseconds !== undefined) {
    return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000).toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestamps(item));
  }
  
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = convertTimestamps(obj[key]);
      }
    }
    return newObj;
  }
  
  return obj;
}

// Define the collections to export
const collectionsToExport = [
  { name: 'destinations', hasSubcollections: false },
  { name: 'quizzes', hasSubcollections: false },
  { name: 'vocab_categories', hasSubcollections: false },
  { name: 'feedback', hasSubcollections: false },
  { name: 'users', hasSubcollections: true, subcollections: ['favorites'] },
  { name: 'posts', hasSubcollections: true, subcollections: ['comments'] },
  { name: 'system_trash', hasSubcollections: false },
  { name: 'notifications', hasSubcollections: false }
];

async function exportAll() {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf('--email');
  const passIdx = args.indexOf('--password');
  
  let email = null;
  let password = null;
  
  if (emailIdx !== -1 && emailIdx < args.length - 1) {
    email = args[emailIdx + 1];
  }
  if (passIdx !== -1 && passIdx < args.length - 1) {
    password = args[passIdx + 1];
  }
  
  if (email && password) {
    console.log(`🔑 Logging in as Admin: ${email}...`);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Successfully authenticated.');
    } catch (err) {
      console.error('❌ Authentication failed:', err.message);
      console.log('Proceeding with unauthenticated export...');
    }
  } else {
    console.log('ℹ️ Unauthenticated mode. (Use --email and --password to authenticate as Admin if needed)');
  }
  
  console.log('\n📥 Exporting Firestore collections...');
  const exportedData = {};
  
  for (const colInfo of collectionsToExport) {
    const colName = colInfo.name;
    console.log(`- Exporting collection: ${colName}...`);
    exportedData[colName] = [];
    
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      
      for (const docSnap of snapshot.docs) {
        const docData = docSnap.data();
        const docId = docSnap.id;
        const record = { id: docId, ...convertTimestamps(docData) };
        
        // Export subcollections if applicable
        if (colInfo.hasSubcollections) {
          for (const subcolName of colInfo.subcollections) {
            try {
              const subcolRef = collection(db, colName, docId, subcolName);
              const subcolSnapshot = await getDocs(subcolRef);
              
              if (!subcolSnapshot.empty) {
                record[subcolName] = [];
                for (const subdocSnap of subcolSnapshot.docs) {
                  record[subcolName].push({
                    id: subdocSnap.id,
                    ...convertTimestamps(subdocSnap.data())
                  });
                }
              }
            } catch (subErr) {
              console.warn(`  ⚠️ Failed to export subcollection '${subcolName}' for doc ${docId}:`, subErr.message);
            }
          }
        }
        
        exportedData[colName].push(record);
      }
      console.log(`  ✅ Successfully exported ${exportedData[colName].length} documents.`);
    } catch (err) {
      console.log(`  ❌ Failed to export collection '${colName}':`, err.message);
      if (err.code === 'permission-denied') {
        console.log(`     (This collection requires Admin authentication. Run with --email and --password)`);
      }
    }
  }
  
  // Write to firestore_export.json
  const exportPath = path.join(__dirname, 'firestore_export.json');
  try {
    fs.writeFileSync(exportPath, JSON.stringify(exportedData, null, 2), 'utf8');
    console.log(`\n🎉 Export completed successfully! Saved to:\n➡️  ${exportPath}`);
    process.exit(0);
  } catch (writeErr) {
    console.error('❌ Failed to write export file:', writeErr.message);
    process.exit(1);
  }
}

exportAll();
