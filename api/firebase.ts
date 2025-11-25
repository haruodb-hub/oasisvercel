import admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
const isInitialized = admin.apps.length > 0;

if (!isInitialized) {
  // Initialize Firebase Admin with credentials from environment
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(
          Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
        )
      : null;

    if (!serviceAccountKey) {
      console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_KEY not set. Products will use fallback storage.');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || (serviceAccountKey as any).project_id,
      });
      db = admin.firestore();
      console.log('✅ Firebase initialized');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
  }
} else {
  db = admin.firestore();
}

export function getDb() {
  return db;
}

export async function saveProductsToFirebase(products: any[]) {
  const database = getDb();
  
  if (!database) {
    console.warn('Firebase not initialized - skipping save');
    return false;
  }

  try {
    const batch = database.batch();
    const collection = database.collection('products');

    // Delete old products
    const existing = await collection.get();
    existing.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      batch.delete(doc.ref);
    });

    // Add new products
    products.forEach((product) => {
      batch.set(collection.doc(product.id), {
        ...product,
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    console.log(`✅ Saved ${products.length} products to Firestore`);
    return true;
  } catch (error) {
    console.error('❌ Error saving to Firestore:', error);
    return false;
  }
}

export async function getProductsFromFirebase() {
  const database = getDb();
  
  if (!database) {
    console.warn('Firebase not initialized - returning empty array');
    return [];
  }

  try {
    const snapshot = await database.collection('products').get();
    const products = snapshot.docs.map(doc => doc.data());
    console.log(`✅ Retrieved ${products.length} products from Firestore`);
    return products;
  } catch (error) {
    console.error('❌ Error reading from Firestore:', error);
    return [];
  }
}
