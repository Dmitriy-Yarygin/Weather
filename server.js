var request = require('request');
var fs = require('fs');
var CITIESWEATHERFILENAME = 'manyCitiesWeather';
var BDPATH = __dirname+'\\bd\\';
// ===================================================================================================
function RefreshWeatherJson(res, cityCode, fullPath, isNewFile) {
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
			res.sendFile(fullPath); 
		} else { //replaceOldFile(fullPath, BDPATH+'temp.tmp'); 
			fs.rename(BDPATH+'temp.tmp', fullPath, function(err){
					if (err) { 
						console.error("Ошибка от rename ", err);
					} else {
						console.log("Все процессы по обновлению файла "+fullPath+" выполнены.");
						res.sendFile(fullPath); 
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
var express = require('express');
var app = express();
app.set('port', 8080);
app.listen(app.get('port'), function () {
  console.log('\n Express server listening on port '+app.get('port'));
});
// устанавливаем движок EJS для представления
app.set('view engine', 'ejs');
// this middleware will be executed for every request to the app
app.use(function (req, res, next) {
	console.log('\n req.url= %s', req.url);
	next();
});
app.use(express.static(__dirname + '/web_content'));
app.use(express.static(BDPATH));
// отображаем главную страницу
app.get('/', function(req, res) { 
  res.render(__dirname+'/web_content/index');
});
app.get('/current',function (req, res, next) {
	var sendingFilePath = BDPATH +CITIESWEATHERFILENAME + '.json';
	res.sendFile(sendingFilePath);
});
app.get('/5days',function (req, res, next) {
	var cityCode = req.url.split("?")[1];
	var fullPath = BDPATH + cityCode + '.json';
	fs.stat(fullPath, function (err, stats){
		if (err) {			
			if (err.code=='ENOENT') {
				console.log('Файл ' + fullPath +' не существует!\nСейчас он будет создан !');
				RefreshWeatherJson(res, cityCode, fullPath, true);
			} else console.error("Ошибка ",err.message);			
		} else {
			console.log('\nПоследнее обновление файла ' + fullPath +'  '+ stats.mtime);
			var howOldIsFile= new Date() - stats.mtime;
			if (howOldIsFile>3600000) { //если файл старше 60минут (60*60*1000=3600 000), обновим его
				console.log(' Прогноз устарел на:    '+ Math.floor(howOldIsFile/60000) + 
							' минут, будем обновлять файл '+fullPath);			
				RefreshWeatherJson(res, cityCode, fullPath, false);
			} else res.sendFile(fullPath); 			
		}	
	});	
});
app.get('/countries', function (req, res, next) {
	citiesExpert.giveCountries(res);
});
app.get('/cities', function (req, res, next) {
	var shortedReq = req.url.split("?")[1];
	console.log('\n shortedReq= %s', shortedReq);
	citiesExpert.giveCities(shortedReq, res);
});
app.get('/loadOptions',function (req, res, next) {
	var sendingFilePath = BDPATH +'options.sav.json';
	res.sendFile(sendingFilePath);
});
app.post('/saveOptions',function (req, res, next) { 
	var saveOptionStream = fs.createWriteStream( BDPATH+'options.sav.json' );
	req.pipe( saveOptionStream );
		saveOptionStream.on("finish", function(){	
 		res.end('Опции в options.sav.json ');
 		shadowRefresh.start(1800000);  // 30минут*60секунд*1000=1800 000 милисекунд
		});
});


app.get('/findCitiesByPartialName',function (req, res, next) { 
	var PartialName = req.url.split("?")[1];
	console.log('\nПроизводим выборку городов начинающихся на '+PartialName);	
	citiesExpert.giveCitiesByPartialName(PartialName, res);
});