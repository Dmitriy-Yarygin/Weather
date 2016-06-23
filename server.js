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
					console.error("Ошибка от statSync ", err);
					if (err.code=='ENOENT') {
						console.log('Файл ' + fullPath +' не существует!\nСейчас он будет создан !');
						RefreshWeatherJson(cityCode, fullPath, true);
					}
				} else {
					console.log(' Последнее обновление файла ' + fullPath +'  '+ stats.mtime);
					var howOldIsFile= new Date() - stats.mtime;
					if (howOldIsFile>3600000) { //если файл старше 60минут (60*60*1000=3600 000), обновим его
						console.log(' Прогноз устарел на:    '+ Math.floor(howOldIsFile/60000) + ' минут, будем обновлять файл '+fullPath);			
						RefreshWeatherJson(cityCode, fullPath, false);
					}			
				}	
			});	
			break;
		case '/saveOptions':  
			req.pipe( fs.createWriteStream( './option.sav.json' ) );
	 		res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }); 
	 		res.end('Опции в option.sav.json ' + new Date());
	 		return;
		case '/loadOptions': req.url='./option.sav.json';
	}
	file.serve(req, res);
}

function RefreshWeatherJson(cityCode, fullPath, isNewFile) {
	console.log('Для города код = ' + cityCode);
	//  var citiesCodes=[706483, 578072, 694165];
	var APPID=["f8313a7e11f53a29ba90ff475f100e8a", "544f6b1390d3fca4deb3c6e2a9b0cdd7", "e477812687453c0b8c0570ad45452cbf", 'b8347443f21cadc6d630440218ec0e00', '2b311535e0af87a8adf774617e51dfbf'];
	//var payload = {'id': cityCode, 'units': 'metric', 'APPID': APPID[ Math.floor ( Math.random() * APPID.length ) ]}
	var weatherUrl="http://api.openweathermap.org/data/2.5/forecast/city?id=" + cityCode + "&units=metric&APPID=" + APPID[ Math.floor ( Math.random() * APPID.length ) ];
	console.log('weatherUrl = ' + weatherUrl);
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

var ObjectMakeManyWeatherJSONs = require('./WeatherInManyCities.js');
console.log('\nЗапускаем WeatherInManyCities');
var shadowRefresh = new ObjectMakeManyWeatherJSONs.WeatherInManyCities(BDPATH);
shadowRefresh.start('706483,578072,694165',1800000);  // 30минут*60секунд*1000=1800 000 милисекунд

// ------ запустить сервер -------
if (!module.parent) {
  http.createServer(accept).listen(8080);
  console.log('\nЗапускаем сервер БЕЗ родителя.');
} else {
  exports.accept = accept;
}


