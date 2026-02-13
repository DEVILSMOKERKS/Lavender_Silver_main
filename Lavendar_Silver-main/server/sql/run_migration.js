const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const connection = await db.getConnection();
    try {
        console.log('Starting migration: Add PAN and Aadhaar columns to orders table...');
        
        const sql = `
            ALTER TABLE \`orders\` 
            ADD COLUMN \`pan_number\` VARCHAR(10) DEFAULT NULL AFTER \`discount_amount\`,
            ADD COLUMN \`aadhaar_number\` VARCHAR(12) DEFAULT NULL AFTER \`pan_number\`
        `;
        
        await connection.execute(sql);
        console.log('✅ Migration completed successfully!');
        console.log('   - Added pan_number column');
        console.log('   - Added aadhaar_number column');
        
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Columns already exist. Migration may have already been run.');
        } else {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    } finally {
        connection.release();
        process.exit(0);
    }
}

runMigration();

