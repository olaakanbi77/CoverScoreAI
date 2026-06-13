const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 1, role: 'admin' }, 'cs_prod_jwt_secret_a7x9k2m5p8q3w6z1');
console.log(token);
