# Overview

## Project Outline

The objective of this project is to create a database that stores information relevant to a group of friends playing video games. The ultimate question to answer is which game(s) that everyone in this group “can” play (if everyone has the gaming system the runs the game) and nobody dislike any feature the game has. The answer is displayed in the “Filter” page,

Project Requirements / Objective:
<ul>
	<li>Use Node.js to build a web-app</li>
	<li>Use express.js to connect to database.</li>
	<li>Use express-handlebars.js and body-parser to build(generate) the web pages.</li>
	<li>Use Unix server to host the app's server node</li>
	<li>Asynchronous javascript</li>
	<li>Use MySQL database provided by the course (phpMyAdmin)</li>
	<li>There must be at least 4 entities and 3 relationships</li>
	<li>There must be at least one filter or search function</li>
	<li>CSS is optional</li>
</ul>

## Main Challenges


For my project idea, the challenge was to build a query function that involves all data from 4 entities (tables) through the M-2-M relationships (tables).  
The query function needs to filter out all games that are not accessible by everyone and/or have features disliked by any one.
Below, “T1” is a table with all the games that are available on game systems which everyone owns it.
“T2” is a table with all the games that are NOT disliked by any person.
Combine the two sets of “Games” to get only the rows that fulfil all creteria.

### The full query:

```mysql
SELECT * FROM (SELECT * FROM versions v INNER JOIN games g ON g.gid = v.fk_gid WHERE v.fk_gsid IN (SELECT gsid FROM ownerships o INNER JOIN game_systems gs ON gs.gsid = o.fk_gsid GROUP BY o.fk_gsid HAVING SUM(o.owns) = (SELECT COUNT(p.pid) AS num_of_members FROM people p))) AS T1 INNER JOIN (SELECT * FROM games g WHERE g.gid NOT IN ( SELECT fk_gid FROM games g INNER JOIN genre gr ON gr.fk_gid = g.gid INNER JOIN features f ON f.fid = gr.fk_fid WHERE f.fid IN (SELECT fk_dislike_id FROM people) )) AS T2 ON T1.gid = T2.gid GROUP BY T1.gid ORDER BY T1.gid ASC
```

Then there is also a callback hell in order to retrieve all the data about games from neighbouring M-2-M tables, with **asynchronous javascript**.
The process needs to:
1.	Get all games and store into games_arr array
2. 	Get all the available game version for each game in games_arr (one game may be published in more than one platform)
3.	Get all the features for each game in games_arr (one game can consist of more than one feature)
4.	Get the list of all features in the database (this is for the "Add New" section to list all available options)
5.	Get the list of all game systems in the database (same as above)

It was only the second week learning javascript, so the only way I was taught to ensure async web-app to build the pages correctly is to rely on this method of using callback. 

### The function code:
```js
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
```



## Project Structure
This project contains four entities (People, Game Systems, Games, and Features). Among them, there are three many-to-many relationships, hence deriving three many-to-many tables (Ownerships, Versions, and Genre). The three m-2-m tables each has two foreign keys as the primary key.

### [ Entity ] People
A list of members in the group of friends. Other than name information, each may have up to one feature they absolutely dislike the most.

### [ Entity ] Game systems 
A list of gaming consoles, computer OS, smartphones, etc..

### [ Entity ] Games 
A list of games available as possible options.

### [ Entity ] Features
A list of game features.

### [ Relationship ] Ownerships 
A record of who owns what game systems. It is required that each member should have at least one game system. To edit / add / delete this relationship, go to People and update the person’s profile.


### [ Relationship ] Versions 
A record of which game is available on which game system. Each game may be available on multiple gaming system, and each gaming system may have multiple games. To add / delete this relationship, adding / deleting games or game systems would affect this data immediately.


### [ Relationship ] Genre 
A record of each game consisting what features. Each game may have multiple features, and each feature may exist in multiple games. To add / delete this relationship, adding / deleting games or features would affect this data immediately.


### [ Final Query ] Filter*
The ultimate answer to the question of "which game for this group to play together".


