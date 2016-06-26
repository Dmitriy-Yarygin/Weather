//var timerId = null;
// ================================================================
function CitiesInCountries(bdDirectory) { 	
	this.bdDirectory = bdDirectory;
}  
// -----------------------------------------------------------------------------------------------
CitiesInCountries.prototype.givePathToTheFile = function(fileName) { 
	var objectCaller = this;
	var fullPath = objectCaller.bdDirectory+fileName;	
	console.log('fullPath = ' + fullPath);
	var fs = require('fs');
	// СИНХРОННО проверяем наличие файла
	try {
		var stats = fs.statSync(fullPath);
    } catch (error) {
		console.log("Ошибка " + error.message);
		return
    }  
	if (stats.isFile()) return fullPath; 
}
// -----------------------------------------------------------------------------------------------
CitiesInCountries.prototype.makeCountriesJSON = function(fileName) { 	
	var objectCaller = this;
	var fullPath = objectCaller.bdDirectory+fileName;
	// асинхронно создаем файл со списком стран
	console.log(" Собираемся создать файл со списком стран." );
	var countriesExtractor = new CountriesExtractor('./bd/city.list.json');    
	//var countriesExtractor = new CountriesExtractor('./bd/testlist.json');     
	readBigFile(countriesExtractor); 
	saveFileWhenReady(); 

	function saveFileWhenReady(){
		setTimeout( function() {
			if (countriesExtractor.flagCountriesListFormed) {
				// переводим список стран в JSON и сохраняем в файл
				var str = JSON.stringify(countriesExtractor.countriesList);
				var fs = require('fs');
				fs.writeFileSync(fullPath, str);
				console.log(" Теперь уж точно создали файл со списком %d стран.", countriesExtractor.countriesList.length); 
			} else {
				saveFileWhenReady();
				console.log("Cписок стран еще не готов - подождем и повторим." ); 
			}
		}, 1000);
	}
}
// -----------------------------------------------------------------------------------------------
function CountriesExtractor(fullPath){
	this.fullPath = fullPath;
	this.flagCountriesListFormed = false;
	this.countriesList = [];
	this.buffer = '';

	this.countriesList.myPush = function(countryName){
		for (var i = 0; i < this.length; i++) {
			if (countryName==this[i]) return;
		}
		this.push(countryName);
	};

	this.countriesList.mySort = function(){
		for (var i=0; i<this.length; i++) { 
		  for (var j=1; j<this.length-i; j++) { 
		    if (this[j-1]>this[j]) {
		      var x=this[j-1];
		      this[j-1]=this[j];
		      this[j]=x;
		    }
		  }   
		}  
	};

}
// -----------------------------------------------------------------------------------------------
CountriesExtractor.prototype.work = function(partialData) { 
	if (partialData){
		this.buffer += partialData;
		var obArray = this.buffer.split("\n");
		for (var i = 0; i < obArray.length-1; i++) {
			var oneCountryObj = JSON.parse( obArray[i] );
			//console.log('%s , %s',oneCountryObj.name,oneCountryObj.country);
			this.countriesList.myPush(oneCountryObj.country);
		}
		this.buffer = obArray[obArray.length-1];
	} else { // если файл оканчивается пустой строкой - больше ничего не нужно делать
		//this.countriesList.myPush( JSON.parse( this.buffer ) .country );
	}
}
// -----------------------------------------------------------------------------------------------
CountriesExtractor.prototype.complete = function() { 
	this.countriesList.mySort();
	//console.log('COMPLETE:'+this.countriesList);
	this.flagCountriesListFormed = true;
}
// -----------------------------------------------------------------------------------------------
function readBigFile (extractor) { 
	var fs = require('fs');
	var stream = fs.createReadStream(extractor.fullPath, {encoding: 'utf8'});

	stream.on('readable', function() {
	    var partialData = stream.read();
		extractor.work(partialData);
	});

	stream.on('end', function() {
	    console.log('Чтение ' + extractor.fullPath + ' выполнено успешно.');
	    extractor.complete();
	});

	stream.on('error', function(err){
		if (err.code=='ENOENT') {
			console.log('Файл ' + extractor.fullPath + ' не найден');	
		}
	});
}
// -----------------------------------------------------------------------------------------------
CitiesInCountries.prototype.makeCitiesJSON = function(countryAbbreviation) { // выборка городов по стране countryAbbreviation
	var objectCaller = this;
	var fullPath = objectCaller.bdDirectory+'citiesOf'+countryAbbreviation + '.json';
	// асинхронно создаем файл со списком городов в стране countryAbbreviation
	console.log(" Собираемся создать файл со списком городов для страны %s.", countryAbbreviation);
	var citiesExtractor = new CitiesExtractor('./bd/city.list.json', countryAbbreviation); 
	//var citiesExtractor = new CitiesExtractor('./bd/testlist.json', countryAbbreviation);     
	readBigFile(citiesExtractor); 
	saveFileWhenReady(); 

	function saveFileWhenReady(){
		setTimeout( function() {
			if (citiesExtractor.isCitiesFileFormed) {
				// переводим список стран в JSON и сохраняем в файл
				var str = JSON.stringify(citiesExtractor.citiesList);
				var fs = require('fs');
				fs.writeFileSync(fullPath, str);
				console.log(" Cоздан файл со списком %d городов для %s.", citiesExtractor.citiesList.length, countryAbbreviation); 
			} else {
				saveFileWhenReady();
				console.log("Cписок городов страны %s еще не готов - подождем и повторим.", countryAbbreviation ); 
			}
		}, 1000);
	}
}
// -----------------------------------------------------------------------------------------------
function CitiesExtractor(fullPath, countryAbbreviation){
	this.fullPath = fullPath;
	this.countryAbbreviation = countryAbbreviation;	
	this.isCitiesFileFormed = false;  
	this.citiesList = [];
	this.buffer = '';

	this.citiesList.mySort = function(){
		for (var i=0; i<this.length; i++) { 
		  for (var j=1; j<this.length-i; j++) { 
		    if (this[j-1].name>this[j].name) {
		      var x=this[j-1];
		      this[j-1]=this[j];
		      this[j]=x;
		    }
		  }   
		}  
	};

}
// -----------------------------------------------------------------------------------------------
CitiesExtractor.prototype.work = function(partialData) { 
	if (partialData){
		this.buffer += partialData;
		var obArray = this.buffer.split("\n");
		for (var i = 0; i < obArray.length-1; i++) {
			var oneCityObj = JSON.parse( obArray[i] );
			if (oneCityObj.country==this.countryAbbreviation) this.citiesList.push({ id: oneCityObj._id, name:  oneCityObj.name });
		}
		this.buffer = obArray[obArray.length-1];
	}  // если файл оканчивается пустой строкой - больше ничего не нужно делать, она останется в буфере, в список ее вносить не будем
}
// -----------------------------------------------------------------------------------------------
CitiesExtractor.prototype.complete = function() { 
	this.citiesList.mySort();
	//console.log('COMPLETE:'+this.citiesList);
	this.isCitiesFileFormed = true;
}
// ===================================================================================================
exports.CitiesInCountries = CitiesInCountries;