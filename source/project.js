module.exports = function(){
    var express = require('express');
    var router = express.Router();
	const util = require('util');

	function getPeople(res, context, mysql, complete){	
		var p_str = "SELECT p.pid, p.in_game_name, p.first_name, p.last_name, f.feature AS 'dislike_feature' FROM people p LEFT JOIN features f ON p.fk_dislike_id = f.fid";
		mysql.pool.query(p_str, function(error, results, fields){
			if(error){
                res.write(JSON.stringify(error));
                res.end();
            }			
			// Write the response result into context's exercise array
			context.person_arr = results;				
			complete();				
		});
	}

	function searchPeople (res, context, mysql, complete)
	{
		var sql = "SELECT p.pid, p.in_game_name, p.first_name, p.last_name, f.feature AS 'dislike_feature' FROM people p INNER JOIN features f ON f.fid = p.fk_dislike_id INNER JOIN ownerships o ON o.fk_pid = p.pid INNER JOIN game_systems gs ON gs.gsid = o.fk_gsid WHERE gs.gsid = ? AND NOT o.owns = 0";
		inserts = context.search;
		mysql.pool.query(sql, inserts, function(error, results, fields){
			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}
			context.person_arr = results;
			complete();
		});
	}
		
	function getPerson_gameSystems(p, res, context, mysql, complete){

		var ign = context.person_arr[p].in_game_name;
		var p_owns_gs_str = "SELECT gs.system_name AS 'Owns', gs.gsid FROM ownerships o INNER JOIN people p ON p.pid = o.fk_pid INNER JOIN game_systems gs ON gs.gsid = o.fk_gsid WHERE in_game_name = ? AND o.owns = 1";
		var inserts = ign;
		//console.log("Looping --- : " + p);
				
		mysql.pool.query(p_owns_gs_str, inserts, function(error, results, fields){
			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}
			else{
			context.person_arr[p].owns = results;	
			//console.log(context.person_arr[p].in_game_name + " : "+ util.inspect(context.person_arr[p].owns));
			complete(p);
			}
		});	
	}	
	
	
	function getAllFeatures(res, context, mysql, complete)
	{
		var f_str = "SELECT * FROM features ORDER BY features.fid ASC";
		mysql.pool.query(f_str, function(error, results, fields){
			if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
			context.feature_arr = results;
			complete();
		});
	}
	
	function getAllGameSystems(res, context, mysql, complete)
	{		
		var gs_str = "SELECT * FROM game_systems ORDER BY game_systems.gsid ASC";
		mysql.pool.query(gs_str, function(error, results, fields){
			if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
			context.game_system_arr = results;
			complete()
		});			
	}
	
	function addPerson(res, context, mysql, complete)
	{
		var sql = "INSERT INTO people (in_game_name, first_name, last_name, fk_dislike_id) VALUES (?,?,?,?)";
		var inserts = [context.in_game_name, context.first_name, context.last_name, context.feature];
		sql = mysql.pool.query(sql, inserts, function(error, results, fields){
			if (error){
				if (error.code == "ER_DUP_ENTRY") {
					res.write("This In-game Name has been taken, please use another one");
				}else{
					res.write(JSON.stringify(error));
				}
				res.end();
			}else{
				complete();
			}
		});
	}
	/* 	
		Requirement: 
			Context{} 
				in_game_name 					//in game name of the person
				owns_gsid[] 					//all gsid this person owns	
		
		Result:
			- Sets ownerships for all game systems a person has
			- Calls complete procedure		
	*/
	function addOwnership(res, context, mysql, complete)
	{
		console.log("addOwnership...");
		console.log(typeof(context.owns_gsid));
		var game_system_arr = [];
		if (typeof(context.owns_gsid) == "string")
		{
			game_system_arr[0] = context.owns_gsid;
		}else{
			game_system_arr = context.owns_gsid;
		}
		callbackCount = 0;
		
		console.log(util.inspect(game_system_arr));
		if (game_system_arr)
		{
			for (id in game_system_arr)
			{
				
				var sql = "INSERT INTO ownerships (fk_pid, fk_gsid, owns) VALUES ((SELECT pid FROM people WHERE in_game_name = ?),?, 1)ON DUPLICATE KEY UPDATE owns=1";
				var inserts = [context.in_game_name, game_system_arr[id]];
				
				sql = mysql.pool.query(sql, inserts, function(error, results, fields){
					if (error){
						res.write(JSON.stringify(error));
						res.end();
					}else{
						callbackCount++;
						console.log("callbackCount---" + callbackCount);
						if (callbackCount >= game_system_arr.length)
						{						
							complete();
						}
					}
				});
			}
		}			
	}
	
	
	function getOwnership(res, context, mysql, complete)
	{
		callbackCount = 0;
		var g = function (i){
			var sql = "SELECT owns FROM ownerships WHERE fk_pid = ? AND fk_gsid = ?";
			var pid = context.person.pid;
			var gsid = context.game_system_arr[i].gsid;
			var inserts = [pid, gsid];
			//console.log("chk 2 ------- \n" + inserts);
			sql = mysql.pool.query(sql, inserts, function(error, results, fields){
				if (error){
					res.write(JSON.stringify(error));
					res.end();
				}else{
					var o;
					if (results[0] == undefined){ 
						o = 0;
					} else { 
						o = results[0].owns 
					}					
					//console.log("check array:");
					//console.log(util.inspect(context.game_system_arr[i]));
					if (o == 1)
					{
						//console.log ( "getOwnership: " + context.game_system_arr[i].system_name + " check!");
						context.game_system_arr[i].check = "checked";
					}else{
						context.game_system_arr[i].check = " ";
					}
					
					callbackCount++;
					if (callbackCount >= context.game_system_arr.length)
					{
						complete();
					}
				}
			});
		}		
		for (gs in context.game_system_arr)
		{
			g(gs);
		}

	}
	
	function resetOwnership(pid, mysql, complete)
	{
		console.log("resetOwnership...");
		var sql = "UPDATE ownerships SET owns=0 WHERE fk_pid=?";
		
		var inserts = pid;
		sql = mysql.pool.query(sql, inserts, function(error, results, fields){
			if (error){
				res.write(JSON.stringify(error));
				res.end();
			}else{
				complete();
			}
		});
	}
	
	function getDislike(context)
	{
		//console.log("getDislike()---------------------------")
		console.log(util.inspect(context));
		for (i = 0; i < context.feature_arr.length; i++)
		{
			//console.log("test : " + context.feature_arr[i].feature  +" and "+ context.person.dislike_feature);
			if (context.feature_arr[i].feature == context.person.dislike_feature)
			{
				context.feature_arr[i].selected = "selected";
			}
		}
	}
	
	
	
	function getGames(res, context, mysql, complete)
	{
		var sql = "SELECT * FROM games ORDER BY games.gid ASC";
		sql = mysql.pool.query(sql, function (error, results, fields){
			if (error){
				res.write(JSON.stringify(error));
				res.end();
			}else{
				context.games_arr = results;
				complete();
			}		
		});
	}
	
	function getGameVersions (i, res, context, mysql, complete)
	{
		//console.log("Looping.....[ " + i +" ]......... ");
		var gid = context.games_arr[i].gid;
		//console.log("gid = " + gid);
		var sql = "SELECT gs.system_name AS 'Ver', gs.gsid FROM game_systems gs INNER JOIN versions v ON v.fk_gsid = gs.gsid INNER JOIN games g ON g.gid = v.fk_gid WHERE g.gid = ? AND v.available = 1";
		var inserts = gid; 
		sql = mysql.pool.query(sql, inserts, function (error, results, fields){
			if (error){
				res.write(JSON.stringify(error));
				res.end();
			}else{
				//console.log("chk..." + i);
				//console.log(util.inspect(context));
				context.games_arr[i].available = results;
				//console.log(util.inspect(context.games_arr[i].available));
				complete();
			}		
		});	
	}
	
	function getGameGenre (j, res, context, mysql, complete)
	{
		var gid = context.games_arr[j].gid;
		var sql = "SELECT f.feature AS 'Feat', f.fid FROM features f INNER JOIN genre gr ON gr.fk_fid = f.fid INNER JOIN games g ON g.gid = gr.fk_gid WHERE g.gid = ? AND gr.consists = 1";
		var inserts = gid; 
		sql = mysql.pool.query(sql, inserts, function (error, results, fields){
			if (error){
				res.write(JSON.stringify(error));
				res.end();
			}else{
				context.games_arr[j].consists = results;
				complete();
			}		
		});			
	}

	
	/// Display all people
	/* 
		Query Operation Sequence :
		- Get all people data.
		- Each person, get all the game systems each owns, and add the array to the person's data.
		- Get all the features in data.
		- Get all the game systems in data.
		- Console print the context object, should contain 3 arrays.
	*/   	
    router.get('/people', function(req, res){
        var context = {};
        var mysql = req.app.get('mysql');		
		
		//console.log("SEARCH--------------------------------");
		//console.log(req.query);
		if(req.query.search){			
			context.search = req.query.search;
			searchPeople(res, context, mysql, complete_getPeople);
		} else {
			getPeople(res, context, mysql, complete_getPeople);
		}
		
		function complete_getPeople(){
			//console.log("getPeople results: ----------------------------");
			//console.log(util.inspect(context));				
			for ( p in context.person_arr )
			{
				getPerson_gameSystems(p, res, context, mysql, complete_writePersonOwns);
				function complete_writePersonOwns(p)
				{		
					//console.log(util.inspect(context.person_arr[p].owns));					
				}
			}
			
			getAllFeatures(res, context, mysql, complete_getAllFeatures);
			
			function complete_getAllFeatures()
			{
				getAllGameSystems(res, context, mysql, completeAllQueries);
				function completeAllQueries(){
					/*
					console.log("final check........ ");
					console.log("person_arr: ------------------------------");
					console.log(util.inspect(context.person_arr));
					console.log("feature_arr: ------------------------------");
					console.log(util.inspect(context.feature_arr));		
					console.log("game_system_arr: ------------------------------");
					console.log(util.inspect(context.game_system_arr));	
					*/
					//console.log("Context to send *********************************** ");
					//console.log(util.inspect(context));
					//res.send(context);
					res.render('people', context);
				}
			}
		}	
    });

	/// Add person
	router.post('/person', function(req, res){
		var mysql = req.app.get('mysql');
		var context = {};
		context = req.body;
		addPerson(res, context, mysql, complete_addPerson);		
		function complete_addPerson()
		{
			addOwnership(res, context, mysql, complete_addOwnership);			
			function complete_addOwnership()
			{
				res.redirect('/people');
			}
		}		
		
	});
	
	/// Delete person
	router.get('/person/delete', function (req, res){
		var mysql = req.app.get('mysql');
				
		// Build the sql query and send out request
        var sql = "DELETE FROM people WHERE pid = ?";
        var inserts = [req.query.pid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            }else{
                res.status(202);
				res.redirect('/people');
            }
        })
		
		
		
	});
	
	/// Go to Edit page
	router.get('/person/edit', function (req, res){
		var mysql = req.app.get('mysql');
		var context = { };
		//var context = { person:null};
		//var p = {pid:null};
		//context.person = p;
		
		//console.log("get/person/edit");
		//console.log(util.inspect(req.query));
		context.person = req.query;		
		getAllFeatures(res, context, mysql, complete_getAllFeatures);
		function complete_getAllFeatures(){
			getDislike(context);
			getAllGameSystems(res, context, mysql, complete_getAllGameSystem);	
			function complete_getAllGameSystem(){
				getOwnership(res, context, mysql, complete_getOwnership);
				function complete_getOwnership(){
					//console.log("Ready to edit person----------- ");
					//console.log(util.inspect(context));
					res.render("update-person", context);
				}
			}
		}
	});
	
	
	/// Update Person
	router.post('/person/update', function (req, res){
		var mysql = req.app.get('mysql');
		var context = {};
		context = req.body;		
	
		//update person
		var sql = "UPDATE people SET in_game_name=?, first_name=?, last_name=?, fk_dislike_id=? WHERE pid=?";	
        var inserts = [req.body.in_game_name, req.body.first_name, req.body.last_name, req.body.feature, req.body.pid];
		sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }else{ //update/insert ownerships				
				resetOwnership(context.pid, mysql, complete_resetOwnership);		//set all ownership of this person to 0
				function complete_resetOwnership(){				
					addOwnership(res, context, mysql, complete_addOwnership);	//set the gs in owns_gsid[] to 1
					function complete_addOwnership(){
						res.redirect('/people');
					}		
				}		
            }
        });		
	});	
	
	
	/// Display Game Systems List
	router.get('/gamesys', function (req, res){
		var mysql = req.app.get('mysql');
		var context = {};
		var sql = "SELECT * FROM game_systems ORDER BY game_systems.gsid ASC";
		sql = mysql.pool.query(sql, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }else{			
				context.game_system_arr = results;
				res.render("gamesys", context);
			}		
				
            
        });			
		
		
	});
	
	/// Add new Game Systems
	router.post('/gamesys', function (req, res){
		var mysql = req.app.get('mysql');
		var context = {};
		var sql = "INSERT INTO game_systems (system_name) VALUES (?)";
		var inserts = req.body.system_name;
		sql = mysql.pool.query(sql, inserts, function(error, results, fields){
			if (error){
				if (error.code == "ER_DUP_ENTRY") {
					res.write("This Game System is already on the list");
				}else{
					res.write(JSON.stringify(error));
				}
				res.end();
			}else{
				res.redirect('/gamesys');
			}
		});		
	});		
	
	/// Delete a game system
	router.get('/gamesys/delete', function (req, res){
		var mysql = req.app.get('mysql');
        var sql = "DELETE FROM game_systems WHERE gsid = ?";
        var inserts = [req.query.gsid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            }else{
                res.status(202);
				res.redirect('/gamesys');
            }
        });		
	});			
	

	
	/// Collect game data and Display all games
	router.get('/games', function(req, res){							//------------------------------------------------- Procedure: Pack all the necessary information into context in a sequencial operation. 
        var context = {};
        var mysql = req.app.get('mysql');		
		
		getGames(res, context, mysql, complete_getGames);				//------------------------------------------------- 1)	Get all games and store into games_arr
		function complete_getGames(){
			callbackCount = 0;
			for ( g in context.games_arr )			
			{
				
				getGameVersions(g, res, context, mysql, complete_getGameVersions);			//----------------------------- 2) 	Get all the available game version for each game in games_arr, 
				function complete_getGameVersions()																			//	store as context > games_arr > available > { game systems }	
				{																																			
					callbackCount ++;																	
					if (callbackCount >= context.games_arr.length)
					{
						callbackCount = 0;
						for ( g2 in context.games_arr)
						{
							getGameGenre(g2, res, context, mysql, complete_getGameGenre);	//------------------------------3)	Get all the features for each game in games_arr,
							function complete_getGameGenre()																//	store as context > games_arr > consists > { features }	
							{	
								callbackCount ++;
								if (callbackCount >= context.games_arr.length)
								{
									getAllFeatures(res, context, mysql, complete_getAllFeatures);		//------------------4)	Get the list of all features in the database, context > feature_arr
									function complete_getAllFeatures()
									{
										getAllGameSystems(res, context, mysql, completeAllQueries);		//------------------5)	Get the list of all game systems in the database, context > game_system_arr
										function completeAllQueries(){
											res.render('games', context);
										}	
									}
								}
							}
						}
					}
				}
			}
		}	
    });
	
	
	function addGame(res, context, mysql, complete)
	{
		var sql = "INSERT INTO games (title) VALUES (?)";
		var inserts = context.title;
		sql = mysql.pool.query(sql, inserts, function(error, results, fields){
			if (error){
				if (error.code == "ER_DUP_ENTRY") {
					res.write("This game is already on the list, please use another one");
				}else{
					res.write(JSON.stringify(error));
				}
				res.end();
			}else{
				complete();
			}
		});
	
	}
	
	function addVersion(res, context, mysql, complete)
	{
		
		//console.log("addVersion------------------");
		//console.log(util.inspect(context.available_gsid));
		
		
		var arr = [];
		if ( typeof(context.available_gsid) == "string")
		{
			arr[0] = context.available_gsid;
		} else {
			arr = context.available_gsid;
		}
		addV_callback = 0;
		var done_callback = arr.length;
		for ( x in arr)
		{
			var id = arr[x];
			var sql = "INSERT INTO versions (fk_gsid, fk_gid, available) VALUES (?, (SELECT gid FROM games WHERE title = ?), 1)";
			var inserts = [id, context.title];
			sql = mysql.pool.query(sql, inserts, function(error, results, fields){
				if (error){
					res.write(JSON.stringify(error));
					res.end();
				}else{
					addV_callback++;
					if (addV_callback >= done_callback)
					{
						complete();
					}
				}
			});		
		}

	}
	
	function addGenre(res, context, mysql, complete)
	{
		var arr = [];
		if ( typeof(context.consists_fid) == "string")
		{
			arr[0] = context.consists_fid;
		} else {
			arr = context.consists_fid;
		}
		addGr_callback = 0;
		var done_callback = arr.length;
		for ( x in arr)
		{
			var sql = "INSERT INTO genre (fk_gid, fk_fid, consists) VALUES ((SELECT gid FROM games WHERE title = ?), ?, 1)";
			var inserts = [context.title, arr[x]];
			sql = mysql.pool.query(sql, inserts, function(error, results, fields){
				if (error){
					res.write(JSON.stringify(error));
					res.end();
				}else{
					addGr_callback++;
					if (addGr_callback >= done_callback)
					{
						complete();
					}
				}
			});		
		}
	}	
	
	/// Add a game
	router.post('/games', function (req, res){
		var context = {};
		var mysql = req.app.get('mysql');
		
		context = req.body;
		//console.log("post /game------------------------------");
		//console.log(util.inspect(req.body));
		addGame(res, context, mysql, complete_addGame);		
		function complete_addGame()
		{
			addVersion(res, context, mysql, complete_addVersion);			
			function complete_addVersion()
			{
				addGenre(res, context, mysql, complete_addGenre);
				function complete_addGenre()
				{
					res.redirect('/games');					
				}
			}
		}
	});		
	
	/// Delete a game 
	router.get('/games/delete', function (req, res){
		var mysql = req.app.get('mysql');
        var sql = "DELETE FROM games WHERE gid = ?";
        var inserts = [req.query.gid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            }else{
                res.status(202);
				res.redirect('/games');
            }
        });		
	});
	
	/// Display all features
	router.get('/features', function (req, res) {
		var context = {};
		var mysql = req.app.get('mysql');
		var sql = "SELECT * FROM features ORDER BY features.fid ASC";
		sql = mysql.pool.query(sql, function(error, results, fields){
			if (error){
				res.write(JSON.stringify(error));
				res.end();
			}else{
				context.features = results;
				res.render('features', context);
			}
		});
	});
	
	/// Add a feature
	router.post('/features', function (req, res){
		var mysql = req.app.get('mysql');
		var context = {};
		var sql = "INSERT INTO features (feature) VALUES (?)";
		var inserts = req.body.feature;
		sql = mysql.pool.query(sql, inserts, function(error, results, fields){
			if (error){
				if (error.code == "ER_DUP_ENTRY") {
					res.write("This Feature is already on the list");
				}else{
					res.write(JSON.stringify(error));
				}
				res.end();
			}else{
				res.redirect('/features');
			}
		});	

	});	
	
	/// Delete a feature
	router.get('/features/delete', function (req, res){
		var mysql = req.app.get('mysql');
        var sql = "DELETE FROM features WHERE fid = ?";
        var inserts = [req.query.fid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            }else{
                res.status(202);
				res.redirect('/features');
            }
        });		
	});	
	

	/// Display all filters
	router.get('/filter', function (req, res) {
		var context = {};
		var mysql = req.app.get('mysql');
		var sql = "SELECT * FROM (SELECT * FROM versions v INNER JOIN games g ON g.gid = v.fk_gid WHERE v.fk_gsid IN (SELECT gsid FROM ownerships o INNER JOIN game_systems gs ON gs.gsid = o.fk_gsid GROUP BY o.fk_gsid HAVING SUM(o.owns) = (SELECT COUNT(p.pid) AS num_of_members FROM people p))) AS T1 INNER JOIN (SELECT * FROM games g WHERE g.gid NOT IN ( SELECT fk_gid FROM games g INNER JOIN genre gr ON gr.fk_gid = g.gid INNER JOIN features f ON f.fid = gr.fk_fid WHERE f.fid IN (SELECT fk_dislike_id FROM people) )) AS T2 ON T1.gid = T2.gid ORDER BY T1.gid ASC";

		sql = mysql.pool.query(sql, function(error, results, fields){
			if (error){
				res.write(JSON.stringify(error));
				res.end();
			}else{
				context.filter_arr = results;
				res.render('filter', context);
			}
		});
	});	
	
	
    return router;
}();