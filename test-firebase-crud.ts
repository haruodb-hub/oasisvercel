#!/usr/bin/env node

/**
 * Firebase CRUD Operations Verification Script
 * Tests all CRUD operations with actual Firestore instance
 */

import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT_KEY = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

console.log('\n📋 Firebase CRUD Test Suite\n');
console.log('Configuration Check:');
console.log(`  ✓ Project ID: ${FIREBASE_PROJECT_ID}`);
console.log(`  ✓ Service Key: ${FIREBASE_SERVICE_ACCOUNT_KEY ? 'SET (length: ' + FIREBASE_SERVICE_ACCOUNT_KEY.length + ')' : 'NOT SET'}`);

if (!FIREBASE_PROJECT_ID || !FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error('\n❌ Missing Firebase configuration!');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  const serviceAccountKey = JSON.parse(
    Buffer.from(FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey as admin.ServiceAccount),
    projectId: FIREBASE_PROJECT_ID,
  });

  console.log('  ✓ Firebase Admin SDK initialized\n');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  process.exit(1);
}

const db = admin.firestore();
const COLLECTION = 'test-products';

// Test data
const testProducts = [
  {
    id: 'test-prod-1',
    name: 'Test Product 1',
    price: 99.99,
    category: 'test',
    image: 'https://via.placeholder.com/300',
    description: 'Test product 1 description',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-prod-2',
    name: 'Test Product 2',
    price: 149.99,
    category: 'test',
    image: 'https://via.placeholder.com/300',
    description: 'Test product 2 description',
    createdAt: new Date().toISOString(),
  },
];

async function runTests() {
  try {
    console.log('🧪 Running CRUD Tests...\n');

    // CREATE - Add products
    console.log('1️⃣  CREATE Operation');
    console.log('   Adding 2 test products to Firestore...');
    const batch = db.batch();
    const collection = db.collection(COLLECTION);

    for (const product of testProducts) {
      batch.set(collection.doc(product.id), {
        ...product,
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
    console.log('   ✅ Successfully created 2 products\n');

    // READ - Get all products
    console.log('2️⃣  READ Operation');
    console.log('   Reading products from Firestore...');
    const snapshot = await db.collection(COLLECTION).get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`   ✅ Successfully read ${products.length} products`);
    console.log(`   Products:`, products.map(p => `\n      - ${p.name} ($${p.price})`).join(''));
    console.log();

    // UPDATE - Modify a product
    console.log('3️⃣  UPDATE Operation');
    console.log('   Updating product price...');
    await db.collection(COLLECTION).doc('test-prod-1').update({
      price: 129.99,
      updatedAt: new Date().toISOString(),
    });
    console.log('   ✅ Successfully updated product\n');

    // Verify update
    const updatedDoc = await db.collection(COLLECTION).doc('test-prod-1').get();
    console.log(`   Verification: New price = $${updatedDoc.data()?.price}\n`);

    // DELETE - Remove a product
    console.log('4️⃣  DELETE Operation');
    console.log('   Deleting test-prod-2...');
    await db.collection(COLLECTION).doc('test-prod-2').delete();
    console.log('   ✅ Successfully deleted product\n');

    // Verify deletion
    const remainingSnapshot = await db.collection(COLLECTION).get();
    console.log(`   Verification: ${remainingSnapshot.size} products remaining\n`);

    // Batch operations test
    console.log('5️⃣  BATCH Operations');
    console.log('   Testing atomic batch update...');
    const batchOp = db.batch();
    const ref1 = db.collection(COLLECTION).doc('test-prod-1');
    const ref2 = db.collection(COLLECTION).doc('test-prod-batch');

    batchOp.update(ref1, { description: 'Updated via batch' });
    batchOp.set(ref2, testProducts[1]);

    await batchOp.commit();
    console.log('   ✅ Batch operation completed (1 update + 1 create)\n');

    // Final count
    const finalSnapshot = await db.collection(COLLECTION).get();
    console.log('📊 Final Status:');
    console.log(`   Total products: ${finalSnapshot.size}`);
    console.log(`   Collection: ${COLLECTION}\n`);

    // Cleanup
    console.log('🧹 Cleanup...');
    const cleanupBatch = db.batch();
    finalSnapshot.docs.forEach(doc => {
      cleanupBatch.delete(doc.ref);
    });
    await cleanupBatch.commit();
    console.log('   ✅ Test data cleaned up\n');

    console.log('✅ All CRUD operations completed successfully!\n');
    console.log('Summary:');
    console.log('  ✓ CREATE: Works');
    console.log('  ✓ READ: Works');
    console.log('  ✓ UPDATE: Works');
    console.log('  ✓ DELETE: Works');
    console.log('  ✓ BATCH operations: Work\n');

    await admin.app().delete();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    await admin.app().delete();
    process.exit(1);
  }
}

runTests();
