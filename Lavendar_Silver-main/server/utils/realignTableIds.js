const db = require('../config/db');

/**
 * Re-aligns ID column of a standalone table (no foreign key!)
 * @param {string} tableName - Table name like 'contact_us'
 */
async function realignTableIds(tableName) {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute(`SELECT * FROM ${tableName} ORDER BY id ASC`);
        if (rows.length === 0) {
            return { success: false, message: 'No rows to realign' };
        }

        await connection.beginTransaction();
        await connection.execute(`ALTER TABLE ${tableName} CHANGE id old_id INT`);
        await connection.execute(`ALTER TABLE ${tableName} ADD id INT FIRST`);

        for (let i = 0; i < rows.length; i++) {
            await connection.execute(`UPDATE ${tableName} SET id = ? WHERE old_id = ?`, [i + 1, rows[i].old_id]);
        }

        await connection.execute(`ALTER TABLE ${tableName} DROP COLUMN old_id`);
        await connection.execute(`ALTER TABLE ${tableName} MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY`);
        await connection.commit();

        return { success: true, message: `IDs realigned in ${tableName}` };
    } catch (err) {
        await connection.rollback();
        return { success: false, message: err.message };
    } finally {
        connection.release();
    }
}

module.exports = { realignTableIds };
