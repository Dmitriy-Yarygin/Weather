//var timerId = null;
// ================================================================
function CitiesInCountries(bdDirectory) { 	
	this.bdDirectory = bdDirectory;
}  
// -----------------------------------------------------------------------------------------------
CitiesInCountries.prototype.giveCountries = function(res) { 
	var objectCaller = this;
	var countriesFullPath = objectCaller.bdDirectory+'countries.json';
	var fs = require('fs');
	// проверяем наличие файла 
	fs.stat(countriesFullPath, function(err, stats){
		if (err) {
			if (err.code=='ENOENT') makeCountriesJSON(res, countriesFullPath);
				else console.error("Ошибка " + err.message);
			return;
		};
		if (stats.isFile()) { 
			res.sendFile(countriesFullPath); 
			// console.log('\n Сервер успешно отправил файл %s', fullPath);
		}
	});
}
// -----------------------------------------------------------------------------------------------
function makeCountriesJSON(res, countriesFullPath) { 
	// асинхронно создаем файл со списком стран
	console.log(" Собираемся создать файл со списком стран." );
	var countriesExtractor = new CountriesExtractor(res, countriesFullPath);  
	readBigFile(countriesExtractor);   // countriesExtractor.countriesList, fullPath
}  	
// -----------------------------------------------------------------------------------------------
function CountriesExtractor(res, countriesFullPath){
	//console.log("Объект CountriesExtractor строит список стран." );
	this.bigFilePath  = './bd/city.list.json';
	this.countriesFullPath = countriesFullPath;	
	this.flagCountriesListFormed = false;
	this.countriesList = [];
	this.buffer = '';
	this.res = res;
//  - - - - - - -
	this.countriesList.myPush = function(countryName){
		for (var i = 0; i < this.length; i++) {
			if (countryName==this[i]) return;
		}
		this.push(countryName);
	};
//  - - - - - - -
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
//  - - - - - - -
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
	// переводим список стран в JSON и сохраняем в файл
	var str = JSON.stringify(this.countriesList);
	var fs = require('fs');
	fs.writeFile(this.countriesFullPath, str, (err) => {
	  if (err) console.error("Не могу сохранить файл со списком стран." + err.message);
	  	else { 
		  	this.res.sendFile(this.countriesFullPath); 
		  	console.log("Cоздан файл %s со списком %d стран.", this.countriesFullPath, this.countriesList.length); 
		};
	});	
}
// -----------------------------------------------------------------------------------------------
function readBigFile (extractor) { 
	var fs = require('fs');
	var stream = fs.createReadStream(extractor.bigFilePath, {encoding: 'utf8'});

	stream.on('readable', function() {
	    var partialData = stream.read();
		extractor.work(partialData);
	});

	stream.on('end', function() {
	    console.log('Чтение ' + extractor.bigFilePath + ' выполнено успешно.');
	    extractor.complete();
	});

	stream.on('error', function(err){
		if (err.code=='ENOENT') {
			console.log('Файл ' + extractor.bigFilePath + ' не найден');	
		} else console.error("Ошибка в readBigFile" + err.message);
	});
}
// -----------------------------------------------------------------------------------------------
CitiesInCountries.prototype.giveCities = function(countryAbbreviation, res) { 
	var objectCaller = this;
	var countryCitiesFullPath = this.bdDirectory + 'citiesOf' + countryAbbreviation + '.json'
	var fs = require('fs');
	// проверяем наличие файла со списком городов страны countryAbbreviation
	fs.stat(countryCitiesFullPath, function(err, stats){
		if (err) {
			if (err.code=='ENOENT') makeCitiesJSON(res, countryAbbreviation, countryCitiesFullPath);
				else console.error("Ошибка " + err.message);
			return;
		};
		if (stats.isFile()) { 
			res.sendFile(countryCitiesFullPath); 
		 	console.log('\n Сервер успешно отправил файл %s', countryCitiesFullPath);
		}
	});
}
// -----------------------------------------------------------------------------------------------
CitiesInCountries.prototype.giveCitiesByPartialName = function(PartialName, res){ 
	var objectCaller = this;
//	console.log('\nБудем возвращать список городов, названия которых начинаются на %s', PartialName);
	var citiesExtractorByPartialName = new CitiesExtractorByPartialName(res, PartialName); 
	readBigFile(citiesExtractorByPartialName); 
}
// -----------------------------------------------------------------------------------------------
function makeCitiesJSON(res, countryAbbreviation, countryCitiesFullPath) { 
	console.log(" Собираемся создать файл со списком городов  %s", countryAbbreviation);
	var citiesExtractor = new CitiesExtractor(res, countryAbbreviation, countryCitiesFullPath); 
	readBigFile(citiesExtractor); 
}
// -----------------------------------------------------------------------------------------------
function CitiesExtractor(res, countryAbbreviation, countryCitiesFullPath){
	console.log("Объект CitiesExtractor строит список городов для страны %s", countryAbbreviation);
	this.res = res;
	this.countryAbbreviation = countryAbbreviation;	
	this.bigFilePath  = './bd/city.list.json';
	this.countryCitiesFullPath = countryCitiesFullPath;	
	this.citiesList = [];
	this.buffer = '';
//  - - - - - - -
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
//  - - - - - - -
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
	// переводим список стран в JSON и сохраняем в файл
	var str = JSON.stringify(this.citiesList);
	var fs = require('fs');
	fs.writeFile(this.countryCitiesFullPath, str, (err) => {
	  if (err) console.error("Не могу сохранить файл со списком городов." + err.message);
	  	else { 
		  	this.res.sendFile(this.countryCitiesFullPath); 
		  	console.log(" Cоздан файл %s со списком %d городов для %s.", this.countryCitiesFullPath, this.citiesList.length, this.countryAbbreviation); 
		};
	});	
}
// -----------------------------------------------------------------------------------------------
				function CitiesExtractorByPartialName(res, PartialName){
					console.log("Объект CitiesExtractorByPartialName строит список городов начинающихся на %s", PartialName);
					this.res = res;
					this.PartialName = PartialName;	
					this.bigFilePath  = './bd/city.list.json';
					this.citiesList = [];
					this.buffer = '';
				}
				// -----------------------------------------------------------------------------------------------
				CitiesExtractorByPartialName.prototype.work = function(partialData) { 
					if (partialData){
						this.buffer += partialData;
						var obArray = this.buffer.split("\n");
						var regexp = new RegExp("^"+this.PartialName, "i");
						//console.log('\n regexp = '+regexp);  
						for (var i = 0; i < obArray.length-1; i++) {
							var oneCityObj = JSON.parse( obArray[i] );
							if (regexp.test(oneCityObj.name)) {
								this.citiesList.push({ id:oneCityObj._id, name: oneCityObj.name, country:oneCityObj.country });
							}   									
						}
						this.buffer = obArray[obArray.length-1];
					}  // если файл оканчивается пустой строкой - больше ничего не нужно делать, она останется в буфере, в список ее вносить не будем
				}
				// -----------------------------------------------------------------------------------------------
				CitiesExtractorByPartialName.prototype.complete = function() { 
					var str = JSON.stringify(this.citiesList);
					this.res.json(this.citiesList); 
					var citiesAr = this.citiesList.map(function(item) {
					  return item.name;
					});
					console.log('\nУшло с сервера:\n'+citiesAr.join('.\t'));
					console.log('\n');
					/*
					  if (err) console.error("Ошибка %ы \nНе могу передать json со списком городов для %s.", err.message, this.citiesList.length, this.PartialName);
					  	else console.log(" Передан json со списком %d городов для %s.", this.citiesList.length, this.PartialName); */
				}
// ===================================================================================================
exports.CitiesInCountries = CitiesInCountries;