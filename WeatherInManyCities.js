var timerId = null;
// ===================================================================================================
// ===================================================================================================
function WeatherInManyCities(bdDirectory) { 	
	this.bdDirectory = bdDirectory;
	this.fullPath = bdDirectory+'manyCitiesWeather.json';
}  
// ===================================================================================================
WeatherInManyCities.prototype.start = function(citiesList, interval) { 	
	var objectCaller = this;
	objectCaller.citiesList = citiesList;
	objectCaller.interval = interval;
	// при первом вызове делаем обновление CitiesWeatherJSON сразу же, а затем с интервалом interval
	//objectCaller.makeCitiesWeatherJSON(citiesList, objectCaller.fullPath);
	if (timerId) { clearInterval(timerId) }; // если был, останавливаем старый таймер
	timerId = setInterval(
		function() {
			objectCaller.makeCitiesWeatherJSON();
		}, interval); 
}
// ===================================================================================================
WeatherInManyCities.prototype.makeCitiesWeatherJSON = function() { 		
	var objectCaller = this;
	var currentTime = new Date();
	console.log( currentTime.getTime()+' обновляем ' + objectCaller.fullPath +' citiesList=' + objectCaller.citiesList + ' interval=' + objectCaller.interval);
	var APPID=["f8313a7e11f53a29ba90ff475f100e8a", "544f6b1390d3fca4deb3c6e2a9b0cdd7", "e477812687453c0b8c0570ad45452cbf", 'b8347443f21cadc6d630440218ec0e00', '2b311535e0af87a8adf774617e51dfbf'];
	var weatherUrl="http://api.openweathermap.org/data/2.5/group?id=" + objectCaller.citiesList + "&units=metric&APPID=" + APPID[ Math.floor ( Math.random() * APPID.length ) ];
	var fs = require('fs');
	var streamToFile = fs.createWriteStream( objectCaller.fullPath );
	var request = require('request');
	request(weatherUrl).pipe(streamToFile);
	streamToFile.on('finish', function() {
		console.error('Процесс получения с http://api.openweathermap.org прогноза погоды для '+objectCaller.citiesList+' завершен.'); 
	});
  // по завершении (когда можно просмотреть погоду в новом городе) сообщить пользователю

}

// ===================================================================================================
// ===================================================================================================
exports.WeatherInManyCities = WeatherInManyCities;