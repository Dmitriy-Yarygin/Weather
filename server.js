var http = require('http');
var url = require('url');
var querystring = require('querystring');
var static = require('node-static');
var file = new static.Server('.', {
  cache: 0
});
var request = require('request');
var fs = require('fs');
var cityWeatherFileName, cityWeatherPath;
var cityName, cityCode;


function accept(req, res) { 	
	console.log('\nЗапрос = ' + req.url);

	if ( req.url.slice(-5)==".json" ) { 
		cityCode = req.url.slice(1,-5);
		cityWeatherFileName = req.url.slice(1);
		cityWeatherPath ='./'+cityWeatherFileName;
	//	req.url = cityWeatherPath;
	//	console.log(' Запрос после = ' + req.url);

		fs.stat(cityWeatherPath, function (err, stats){
			if (err) {
				console.error("Ошибка от statSync ", err);
				if (err.code=='ENOENT') {
					console.log('Файл ' + cityWeatherFileName +' не существует!\nСейчас он будет создан !');
					RefreshWeatherJson(cityCode, true);
				}
			} else {
				console.log(' Последнее обновление файла ' + cityWeatherFileName +'  '+ stats.mtime);
				var howOldIsFile= new Date() - stats.mtime;
				if (howOldIsFile>1800000) { //если файл старше 30минут (30*60*1000=1800 000), обновим его
					console.log(' Прогноз устарел на:    '+ Math.floor(howOldIsFile/60000) + ' минут, будем обновлять файл '+cityWeatherFileName);			
					RefreshWeatherJson(cityCode, false);
				}			
			}	
		});	
		file.serve(req, res); 
 	} else if ( req.url == "/saveOptions" ) {
		req.pipe( fs.createWriteStream( './option.sav.json' ) );
 		res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }); 
 		res.end('Опции в option.sav.json ' + new Date());
 		return;
	} else if ( req.url == "/loadOptions" ) {
		//=========================================================
		req.url='./option.sav.json';
 	}
	file.serve(req, res);
}

function RefreshWeatherJson(cityCode, isNewFile) {	
	//console.log('Для города код = ' + cityCode);
	//  var citiesCodes=[706483, 578072, 694165];
	var APPID=["f8313a7e11f53a29ba90ff475f100e8a", "544f6b1390d3fca4deb3c6e2a9b0cdd7", "e477812687453c0b8c0570ad45452cbf", 'b8347443f21cadc6d630440218ec0e00', '2b311535e0af87a8adf774617e51dfbf'];
	//var payload = {'id': cityCode, 'units': 'metric', 'APPID': APPID[ Math.floor ( Math.random() * APPID.length ) ]}
	var weatherUrl="http://api.openweathermap.org/data/2.5/forecast/city?id=" + cityCode + "&units=metric&APPID=" + APPID[ Math.floor ( Math.random() * APPID.length ) ];
	var r = request(weatherUrl);	
	var streamToFile = fs.createWriteStream( (isNewFile) ? cityWeatherFileName : cityWeatherFileName+'.fresh' );
	r.pipe(streamToFile);

	streamToFile.on('finish', function() {
		if (isNewFile) { console.error('Процесс получения с http://api.openweathermap.org прогноза погоды для '+cityCode+' завершен.'); }
		else { replaceOldFile(cityWeatherFileName, cityWeatherFileName+'.fresh'); }	
	});
}

function replaceOldFile(filePath, newFilePath) {	
	var oldfilePath = filePath+".old"

	fs.rename(filePath, oldfilePath, function(err){
		if (err) { 
			console.error("Ошибка от rename1 ", err);
		} else {
			//console.log("Файл "+filePath+" успешно переименован "+oldfilePath);
			fs.rename(newFilePath, filePath, function(err){
				if (err) { 
					console.error("Ошибка от rename2 ", err);
				} else {
					//console.log("Файл "+newFilePath+" успешно переименован в "+filePath);
					fs.unlink(oldfilePath, function(err){
						if (err) { 
							console.error("Ошибка от unlink ", err);
						} else {
							//console.log("Файл "+oldfilePath+" успешно удален.");
							console.log("Все процессы по обновлению файла "+filePath+" выполнены.");
						}	
					});
				}	
			});	
		};
	});		

}
// ------ запустить сервер -------
if (!module.parent) {
  http.createServer(accept).listen(8080);
  console.log('\nЗапускаем сервер БЕЗ родителя.');
} else {
  exports.accept = accept;
}