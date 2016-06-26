var http = require('http');
var url = require('url');
var querystring = require('querystring');
var static = require('node-static');
var file = new static.Server('.', {
  cache: 0
});	
var request = require('request');
var fs = require('fs');
var CITIESWEATHERFILENAME = 'manyCitiesWeather';
var BDPATH = './bd/';
var currentDir = __dirname;
// ===================================================================================================
function accept(req, res) { 	
	console.log('\nЗапрос = ' + req.url);
	shortedReq = req.url.slice(0, req.url.indexOf("?") );
	switch(shortedReq) {
		case '/current':   
			req.url = BDPATH +CITIESWEATHERFILENAME + '.json';
			break;
		case '/5days':  
			var cityCode = req.url.slice(-6);
			var fullPath = BDPATH + cityCode + '.json';
		 	req.url = fullPath;
			//console.log(' Запрос после = ' + req.url);
			fs.stat(fullPath, function (err, stats){
				if (err) {
					console.error("Ошибка от stat ", err);
					if (err.code=='ENOENT') {
						console.log('Файл ' + fullPath +' не существует!\nСейчас он будет создан !');
						RefreshWeatherJson(cityCode, fullPath, true);
					}
				} else {
					console.log('\nПоследнее обновление файла ' + fullPath +'  '+ stats.mtime);
					var howOldIsFile= new Date() - stats.mtime;
					if (howOldIsFile>3600000) { //если файл старше 60минут (60*60*1000=3600 000), обновим его
						console.log(' Прогноз устарел на:    '+ Math.floor(howOldIsFile/60000) + ' минут, будем обновлять файл '+fullPath);			
						RefreshWeatherJson(cityCode, fullPath, false);
					}			
				}	
			});	
			break;
		case '/saveOptions':  
			var saveOptionStream = fs.createWriteStream( BDPATH+'options.sav.json' );
			req.pipe( saveOptionStream );
	 		saveOptionStream.on("finish", function(){		 			
		 		res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }); 
		 		res.end('Опции в options.sav.json ');
		 		shadowRefresh.start(1800000);  // 30минут*60секунд*1000=1800 000 милисекунд
	 		});
	 		return;
		case '/loadOptions': 
			req.url=BDPATH+'options.sav.json';
			break;
		case '/countries':  		
			var PathToJSON = citiesExpert.givePathToTheFile('countries.json');
			// проверяем наличие файла со списком стран
			if (PathToJSON === undefined) {
				// при отсутствии файла со списком стран - формируем файл и просим клиента обратиться позже				
				res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }); 
		 		res.end('REPEAT'); // Повторите запрос позже, файл будет сформирован
				// citiesExpert.flagCountriesFileFormed = false;  // ???
				citiesExpert.makeCountriesJSON('countries.json');
		 		return;
			}
			// при наличии файла со списком стран - выдаем
			req.url = PathToJSON;
			break;
		case '/cities':  		
			var countryAbbreviation = req.url.slice(req.url.indexOf("?")+1);
			//console.log('countryAbbreviation ='+countryAbbreviation);
			var PathToJSON = citiesExpert.givePathToTheFile('citiesOf'+countryAbbreviation + '.json');
			//console.log('PathToJSON = '+PathToJSON);
			// проверяем наличие файла со списком городов для страны countryAbbreviation
			if (PathToJSON === undefined) {
				// при отсутствии файла со списком стран - формируем файл и просим клиента обратиться позже				
				res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }); 
		 		res.end('REPEAT'); // Повторите запрос позже, файл будет сформирован
		 		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		 		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		 		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				// citiesExpert.CitiesFileFormedFor[countryAbbreviation] = false;   ???
				citiesExpert.makeCitiesJSON(countryAbbreviation);
		 		return;
			}
			// при наличии файла со списком стран - выдаем
			req.url = PathToJSON;
	}
	file.serve(req, res);
}
//-------------------------------------------------------------------------------------
function RefreshWeatherJson(cityCode, fullPath, isNewFile) {
	//  console.log('Для города код = ' + cityCode);
	//  var citiesCodes=[706483, 578072, 694165];
	var APPID=["f8313a7e11f53a29ba90ff475f100e8a", "544f6b1390d3fca4deb3c6e2a9b0cdd7", "e477812687453c0b8c0570ad45452cbf", 'b8347443f21cadc6d630440218ec0e00', '2b311535e0af87a8adf774617e51dfbf'];
	//  var payload = {'id': cityCode, 'units': 'metric', 'APPID': APPID[ Math.floor ( Math.random() * APPID.length ) ]}
	var weatherUrl="http://api.openweathermap.org/data/2.5/forecast/city?id=" + cityCode + "&units=metric&APPID=" + APPID[ Math.floor ( Math.random() * APPID.length ) ];
	//  console.log('weatherUrl = ' + weatherUrl);
	var r = request(weatherUrl);
	var streamToFile = fs.createWriteStream( (isNewFile) ? fullPath : BDPATH+'temp.tmp' );
	r.pipe(streamToFile);

	streamToFile.on('finish', function() {
		if (isNewFile) { 
			console.error('Процесс получения с http://api.openweathermap.org прогноза погоды для '+cityCode+' завершен.'); 
		} else { //replaceOldFile(fullPath, BDPATH+'temp.tmp'); 
			fs.rename(BDPATH+'temp.tmp', fullPath, function(err){
					if (err) { 
						console.error("Ошибка от rename ", err);
					} else {
						console.log("Все процессы по обновлению файла "+fullPath+" выполнены.");
					}	
			});	
		}	
	});
}
//----------------------------------
function cls(n){
	for (var i=0;i<n;i++) console.log('\n');
}
// ==================================================================================================
var ObjectMakeManyWeatherJSONs = require('./WeatherInManyCities.js');
cls(10);
console.log('\nЗапускаем WeatherInManyCities - для автоматического обновления текущего прогноза по городам = "Белка в колесе".');
var shadowRefresh = new ObjectMakeManyWeatherJSONs.WeatherInManyCities(BDPATH);
shadowRefresh.start(1800000);  // 30минут*60секунд*1000=1800 000 милисекунд
//-------------------------------------------------------------------------------------
var CitiesInCountries = require('./CitiesInCountries.js');
console.log('\nЗапускаем CitiesInCountries - для работы со списком стран и городов внутри страны.');
var citiesExpert = new CitiesInCountries.CitiesInCountries(BDPATH);
// ---------------- запустить сервер ----------------
if (!module.parent) {
  http.createServer(accept).listen(8080);
  console.log('\nЗапускаем сервер БЕЗ родителя.');
} else {
  exports.accept = accept;
}
