var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit : 1000,
	connectTimeout  : 60 * 60 * 1000,
	aquireTimeout   : 60 * 60 * 1000,
	timeout         : 60 * 60 * 1000,
	host            : '35.234.62.232',
	user            : 'generic_user',
	password        : 'sNyQnQJ8ZW65rK2',
	database        : 'tsuio_db'
});

pool.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});

module.exports.pool = pool;
