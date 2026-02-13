const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
    return await bcrypt.compare(plain, hash);
}

module.exports = {
    hashPassword,
    comparePassword,
    SALT_ROUNDS
};
