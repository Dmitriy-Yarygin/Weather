var timerId = null;
// ===================================================================================================
function WeatherInManyCities(bdDirectory) { 	
	this.bdDirectory = bdDirectory;
	this.fullPath = bdDirectory+'manyCitiesWeather.json';
}  
// -----------------------------------------------------------------------------------------------
WeatherInManyCities.prototype.start = function(interval) { 	
	var objectCaller = this;
//	objectCaller.citiesList = '706483,578072,694165';  
	objectCaller.interval = interval;
	readOptionsList(objectCaller, "options.sav.json");
	if (timerId) { clearInterval(timerId) }; // если был, останавливаем старый таймер
	timerId = setInterval(
		function() {
			objectCaller.makeCitiesWeatherJSON();
		}, interval); 
}
// -----------------------------------------------------------------------------------------------
function readOptionsList (objectCaller, fileName) { 
	var fullPath = objectCaller.bdDirectory + fileName; 
	var fs = require('fs');
	fs.readFile( fullPath, {encoding: 'utf8'}, function (err, data) {
	    if (err) console.log(err);
	    giveCitiesList(objectCaller, data);
	});
}
// -----------------------------------------------------------------------------------------------
function giveCitiesList(objectCaller, data){ 
	try {
        var OptionsArray = JSON.parse( data );  
        // console.log ('Получены данные из файла опций'+data+' после JSON.parse =>'+OptionsArray);
        if (OptionsArray.length){
        	objectCaller.citiesList=OptionsArray[0].value;
        	for (var i=1; i<OptionsArray.length; i++) { 
        		objectCaller.citiesList += ','+ OptionsArray[i].value; };
	        console.log ('\ngiveCitiesList: ' + objectCaller.citiesList);
        } else console.log("Cписок городов сформирован ПУСТЫМ!");        
	} catch (e) {
		console.log("Сложности в формировании списка кодов городов " + e.message);
	}  
 	objectCaller.makeCitiesWeatherJSON();  
	 //////      //////      //////      //////      //////      //////      //////      //////      //////      
	  //////      //////      //////      //////      //////      //////      //////      //////      //////      
	   //////      //////      //////      //////      //////      //////      //////      //////      //////      
	    //////      //////      //////      //////      //////      //////      //////      //////      //////      
}
// -----------------------------------------------------------------------------------------------
WeatherInManyCities.prototype.makeCitiesWeatherJSON = function() { 		
	var objectCaller = this;
	var currentTime = new Date();
	var timeString = currentTime.getHours()+':'+currentTime.getMinutes();
	console.log( '\n"Белка в колесе": в '+ timeString +' обновляем ' + objectCaller.fullPath +' citiesList=' + objectCaller.citiesList + ' interval=' +  Math.floor(objectCaller.interval/60000) + ' минут');
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
exports.WeatherInManyCities = WeatherInManyCities;