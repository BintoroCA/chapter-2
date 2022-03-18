const { Pool } =  require('pg');

const dbPool = new Pool({
    database:'personal-web',
    port:'5000',
    user:'postgres',
    password:'shogun125sp',
});

module.exports = dbPool;