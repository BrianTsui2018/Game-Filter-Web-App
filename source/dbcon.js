var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit : 1000,
	connectTimeout  : 60 * 60 * 1000,
	aquireTimeout   : 60 * 60 * 1000,
	timeout         : 60 * 60 * 1000,
	host            : 'your_db_host',
	user            : 'your_db_user_name',
	password        : 'your_db_password_here',
	database        : 'your_db_name'
});

pool.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});

module.exports.pool = pool;
