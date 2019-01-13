DROP TABLE IF EXISTS `people`;
DROP TABLE IF EXISTS `ownerships`;
DROP TABLE IF EXISTS `game_systems`;
DROP TABLE IF EXISTS `versions`;
DROP TABLE IF EXISTS `games`;
DROP TABLE IF EXISTS `genre`;
DROP TABLE IF EXISTS `features`;


CREATE TABLE game_systems (
	gsid SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,				
	system_name VARCHAR(255) NOT NULL,							-- name of the gaming platform (PC, android, XBox, PS4)
	PRIMARY KEY (gsid),
	UNIQUE (system_name)
) ENGINE=InnoDB;

CREATE TABLE games (
	gid SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,				
	title VARCHAR(255) NOT NULL,								-- game title					
	PRIMARY KEY (gid),
	UNIQUE (title)
) ENGINE=InnoDB;

CREATE TABLE features (
	fid SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,				
	feature VARCHAR(255) NOT NULL,								-- game feature				
	PRIMARY KEY (fid),
	UNIQUE (feature)
) ENGINE=InnoDB;


CREATE TABLE people (
	pid SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
	in_game_name VARCHAR(255) NOT NULL,							-- alias
	first_name VARCHAR(255),
	last_name VARCHAR(255),
	fk_dislike_id SMALLINT UNSIGNED,							-- the game feature that this person dislikes the most
	PRIMARY KEY (pid),
	CONSTRAINT fk_dislike_id FOREIGN KEY (fk_dislike_id) REFERENCES features (fid) ON DELETE SET NULL ON UPDATE CASCADE,
	UNIQUE KEY  (in_game_name)
) ENGINE=InnoDB;

CREATE TABLE ownerships (
	fk_pid SMALLINT UNSIGNED NOT NULL,							-- person  	
	fk_gsid SMALLINT UNSIGNED NOT NULL,							-- game system
	owns BOOLEAN,												-- true if this person (pid) owns this game system (gsid)
	PRIMARY KEY (fk_pid, fk_gsid),	
	CONSTRAINT fk_pid_own	FOREIGN KEY (fk_pid) REFERENCES people (pid) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT fk_gsid_own FOREIGN KEY (fk_gsid) REFERENCES game_systems (gsid) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE versions (
	fk_gid SMALLINT UNSIGNED NOT NULL,							-- game system 	
	fk_gsid SMALLINT UNSIGNED NOT NULL,							-- games
	available BOOLEAN,											-- true if this game is available on this platform
	PRIMARY KEY (fk_gid, fk_gsid),
	CONSTRAINT fk_gid_ver FOREIGN KEY (fk_gid) REFERENCES games (gid) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT fk_gsid_ver FOREIGN KEY (fk_gsid) REFERENCES game_systems (gsid) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE genre (
	fk_gid SMALLINT UNSIGNED NOT NULL,							-- game	
	fk_fid SMALLINT UNSIGNED NOT NULL,							-- feature
	consists BOOLEAN,											-- true if this game consists this feature
	PRIMARY KEY (fk_gid, fk_fid),
	CONSTRAINT fk_fid_gen FOREIGN KEY (fk_fid) REFERENCES features (fid) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT fk_gid_gen FOREIGN KEY (fk_gid) REFERENCES games (gid) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;




INSERT INTO game_systems(system_name) VALUES 
	('PC'),						-- 1
	('Xbox One'),				-- 2
	('PlayStation 4'),			-- 3
	('Wii U'),					-- 4
	('Switch'),					-- 5
	('Nintendo DS'),			-- 6
	('PSVita'), 				-- 7
	('Android'), 				-- 8
	('IOS')						-- 9
	;


INSERT INTO games(title) VALUES 
	('Minecraft'),					-- 1
	('Team Fortress 2'),			-- 2
	('Mabinogi'),					-- 3
	('Monster Hunter World'),		-- 4
	('Civilization 6'),				-- 5
	('Super Smash Brothers U'),		-- 6
	('Zelda Breath of the Wild'),	-- 7
	('Sims 4'),						-- 8
	('Nier Automata'),				-- 9
	('Clash of Clans'),				-- 10
	('Candy Crush'),				-- 11
	('Overcook'),					-- 12
	('PUBG'),						-- 13
	('World of Warcraft'),			-- 14
	('Terraria'),					-- 15
	('Doki Doki Literature Club')	-- 16
	;


INSERT INTO features(feature) VALUES 
	('Sandbox'),				-- 1
	('Survival'),				-- 2
	('First Person Shooter'),	-- 3
	('RPG'),					-- 4
	('MMO'),					-- 5
	('HD'),						-- 6
	('Strategy'),				-- 7
	('Online Multiplayer'),		-- 8
	('Online Co-op'),			-- 9
	('Single Player'),			-- 10
	('Local Multiplayer'),		-- 11
	('Local Co-op'),			-- 12
	('Simulator'),				-- 13
	('Portable'),				-- 14
	('Puzzle'),					-- 15
	('Pixel art'),				-- 16
	('VR'),						-- 17
	('AR'),						-- 18
	('Pay2win'),				-- 19
	('Free to play'),			-- 20
	('MOBA'),					-- 21
	('Fighting')				-- 22
	;
	

INSERT INTO people(in_game_name, first_name, last_name, fk_dislike_id) VALUES 
	('Rits','Brian','Tsui','19'),
	('ElevenPM','Cyrus','Au','3'),
	('Phy','Raphael','Wong','16'),
	('Tak','Terence','Wong','12'),
	('J','Jacky','Yeung', NULL)
	;
	

INSERT INTO ownerships(fk_pid, fk_gsid, owns) VALUES
	('1','1','1'),
	('1','4','1'),
	('1','8','1'),
	('2','1','1'),
	('2','3','1'),
	('2','9','1'),
	('3','1','1'),
	('3','7','1'),
	('3','6','1'),
	('4','1','1'),
	('4','2','1'),
	('4','5','1'),
	('4','8','1'),	
	('4','9','1'),
	('5','1','1'),
	('5','2','1'),
	('5','8','1')
	;

INSERT INTO versions(fk_gid, fk_gsid, available) VALUES
	('1','1','1'),
	('1','2','1'),
	('1','3','1'),
	('1','8','1'),
	('1','9','1'),
	('2','1','1'),
	('3','1','1'),
	('4','1','1'),
	('4','3','1'),
	('4','5','1'),
	('4','7','1'),
	('5','1','1'),
	('6','4','1'),
	('6','6','1'),
	('7','5','1'),
	('8','1','1'),
	('9','1','1'),
	('9','3','1'),
	('10','8','1'),
	('10','9','1'),
	('11','8','1'),
	('11','9','1'),
	('12','1','1'),
	('12','2','1'),
	('12','3','1'),
	('12','4','1'),
	('12','5','1'),
	('13','1','1'),
	('14','1','1'),
	('15','1','1'),
	('16','1','1')
	;
	
INSERT INTO genre(fk_gid, fk_fid, consists) VALUES
	('1','1','1'),
	('1','2','1'),
	('2','3','1'),
	('2','8','1'),
	('3','4','1'),
	('3','5','1'),
	('4','4','1'),
	('4','5','1'),
	('4','6','1'),
	('4','12','1'),
	('5','7','1'),
	('5','8','1'),
	('6','8','1'),
	('6','9','1'),
	('6','12','1'),
	('6','11','1'),
	('6','22','1'),
	('7','2','1'),
	('7','4','1'),
	('7','6','1'),
	('7','14','1'),
	('8','13','1'),
	('9','4','1'),
	('10','14','1'),
	('10','7','1'),
	('11','14','1'),
	('11','15','1'),
	('12','12','1'),
	('13','3','1'),
	('14','5','1'),
	('15','1','1'),
	('16','13','1')		
	;

