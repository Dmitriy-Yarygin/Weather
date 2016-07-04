var pageHeader = document.getElementsByTagName('header')[0];
var rangeForecast = document.getElementsByClassName('rangeForecast')[0];
var main = document.getElementsByTagName('main')[0];
var pageFooter = document.getElementsByTagName('footer')[0];
//selectCity1.selectedIndex = -1;
loadWeatherForCity( selectCity1.options[selectCity1.selectedIndex].value );
// =============================================================================

rangeForecast.onchange = function(){  
  var ending = (rangeForecast.value!=1) ? 's' : '';
  document.getElementsByClassName('labelForRangeForecast')[0].innerHTML = 
    'Display '+rangeForecast.value+ ' row' + ending + ' forecast '; 
}

requestButton.onclick = function(){
  loadWeatherForCity( selectCity1.options[selectCity1.selectedIndex].value );
}

function loadWeatherForCity(cityCode) {
  var cityName = selectCity1.options[selectCity1.selectedIndex].innerHTML;
  infoBoxWrite('Сервер формирует ответ по '+cityName+'.\nПожалуйста подождите!');
  requestButton.innerHTML = 'Weather request for '+ cityName;
  var myReq = (rangeForecast.value==1) ? 'current?' : '5days?';
  myReq+= cityCode;
  requestToMyServer('GET', myReq, null, function(responseText){
      //console.log(responseText);
      try { 
        var x = JSON.parse( responseText );  
        infoBoxWrite('Получены данные погоды для '+cityName);
      } catch (e) {
        alert("ТРАБЛЫ " + e.message);
      }  
  });
}

function requestToMyServer(method, myReq, body, callbackFunction) {
  var xhr = new XMLHttpRequest();
  xhr.open(method, myReq, true);
  if (method=='GET') { xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest"); }
  else if (method=='POST') { xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8'); }
  xhr.send(body);
  
  xhr.onreadystatechange = function() {
    if (xhr.readyState != 4) return;
    if (xhr.status != 200) {
      // обработать ошибку
      alert('Ошибка. Ответ сервера '+xhr.status + ': ' + xhr.statusText);
    } else { 
      callbackFunction( xhr.responseText );        
    }
  }
}
// *************************************************************************************************
  var fragment = document.createDocumentFragment();
  var tableNameElem = document.createElement('h3');
  var WeatherTable = createTableHead(['Time', 'Temperature', 'Pressure', 'Humidity', 'Weather']);
  // дальше заполняем строки таблицы и ... название таблицы = названию города
  if (rows==1) {
    var  weatherObj = findObjInList( x.list, cityCode );
    tableNameElem.innerHTML = weatherObj.name;
    FillRowCurrentWeather(WeatherTable, weatherObj);
  } else {
    tableNameElem.innerHTML = x.city.name;
    fillRowsXdaysWeather(WeatherTable, x.list, rows);
  } 
  fragment.appendChild(tableNameElem);
  fragment.appendChild(WeatherTable);
  createDivInMain(fragment);
}
// *************************************************************************************************  
function createDivInMain(insertedObject){
  var myDiv = document.createElement('div');  
  myDiv.appendChild( insertedObject );
  changeMainHeight(); // регулирует высоту блока main в котором выводятся таблицы
  main.appendChild(myDiv);
  myDiv.scrollIntoView();
  return myDiv;
}

// *************************************************************************************************  
function delAllDivsInMain(){	
	while (main.lastElementChild) { // удалим старые div
          main.removeChild(main.lastElementChild);
    }
}
// *************************************************************************************************
function createTableHead(thArray){
  var TableHead = document.createElement('table');
  TableHead.style.textAlign = "center";
  var trElem = document.createElement('tr');
  thArray.forEach( (item) => {
    var el=document.createElement('th'); 
    el.innerHTML= item;    
    trElem.appendChild(el);
  });
  TableHead.appendChild(trElem);  
  return TableHead;
}
// *************************************************************************************************
function changeMainHeight() {  // регулирует высоту блока main в котором выводятся таблицы
  var availableHeight = document.documentElement.clientHeight *0.6 ^ 0;
  if (availableHeight<200) availableHeight=200;
  // alert("расчетная высота "+availableHeight);
  main.style.maxHeight=availableHeight+"px"
}
// *************************************************************************************************  
function findObjInList(list,cityCode){ // возвращает объект соответствующий описанию текущей погоды для города cityCode в list (из manyCitiesWeather.json)
  for (var j=0; j<list.length; j++){
    if (list[j].id==cityCode) return list[j];
  }
  return null;
}
// *************************************************************************************************  
function FillRowCurrentWeather(WeatherTable, weatherObj){
  if (weatherObj===null) return;
  var trElem = document.createElement('tr');
  var date = new Date( weatherObj.dt*1000 );  
  var options = { /*era: 'long', year: "2-digit",*/ month: "2-digit", day: "2-digit", weekday: "short", /*timezone: 'UTC',*/ 
                  hour: 'numeric', minute: 'numeric', /*second: 'numeric'*/};
//alert( date.toLocaleString("ru", options) ); // среда, 31 декабря 2014 г. н.э. 12:30:00
//alert( date.toLocaleString("en-US", options) ); // Wednesday, December 31, 2014 Anno Domini 12
  var timeString = date.toLocaleString("en-US", options);
  var tdArray = [timeString, weatherObj.main.temp, weatherObj.main.pressure, weatherObj.main.humidity, weatherObj.weather[0].description ];
  for (var i=0; i<tdArray.length; i++) {
    var tdElem = document.createElement('td');
    tdElem.innerHTML = tdArray[i];
    trElem.appendChild( tdElem );
  }  
  WeatherTable.appendChild(trElem);
}; 
// *************************************************************************************************
function fillRowsXdaysWeather(WeatherTable, list, rows){
  for (var j=0; j < rows; j++) {
    var trElem = document.createElement('tr');
    var tdArray = [list[j].dt_txt, list[j].main.temp, list[j].main.pressure, list[j].main.humidity, list[j].weather[0].description];
    for (var i=0; i<tdArray.length; i++) {
      var tdElem = document.createElement('td');
      tdElem.innerHTML = tdArray[i];
      trElem.appendChild( tdElem );
    }  
    WeatherTable.appendChild(trElem);
  }  
}
// *************************************************************************************************
function saveOptions(){ 
  infoBoxWrite('Сервер сохраняет опции текущего селекта.\nПожалуйста подождите!');
// чтобы сохранить текущий список опций из селекта делаем json
  var obj = selectCity1.options[0];  
  var body = '[{"value":"'+obj["value"]+'", "text":"'+obj["text"]+'"}';
  for (var i=1; i<selectCity1.options.length; i++) {
    obj = selectCity1.options[i];
    body+=',{"value":"'+obj["value"]+'", "text":"'+obj["text"]+'"}';
  }
  body+=']';
  //console.log(body); 
  var myReq = '/saveOptions';
  requestToMyServer('POST', myReq, body, function(responseText){
    infoBoxWrite('Ответ сервера на запрос записи опций:<br>'+responseText);
  });
}
// *************************************************************************************************
function infoBoxWrite(textToShow){ 
    var pElem = document.createElement('p');
    pElem.innerHTML = textToShow;
    pElem.style.cssText="margin-top: 2em; background: rgba(255, 249, 7, 0.41);"
    pageFooter.appendChild( pElem );
    pElem.scrollIntoView();
}
// *************************************************************************************************
function loadOptions(){ 
  infoBoxWrite('На сервер отправлен запрос опций для текущего селекта.\nПожалуйста подождите!');
  var myReq = '/loadOptions';
  requestToMyServer('GET', myReq, null, function(responseText){
      try {
        var newOptionsArray = JSON.parse( responseText ); 

        while (selectCity1.lastElementChild) { // удалим старые опции
          //console.log('Сейчас удалим '+selectCity1.lastElementChild.value);
          selectCity1.removeChild(selectCity1.lastElementChild);
        }
        // полученными с сервера опциями заполняем селект
        var citiesAr = [];
        newOptionsArray.forEach(function(item) { 
          newSelectOption(selectCity1, item.value, item.text);
          citiesAr.push(item.text);
        }); 
        infoBoxWrite('Успешно получили с сервера опции для селекта '+ citiesAr.join(' ... '));           
      } catch (e) {
        alert("Сложности с JSON.parse опций для селекта " + e.message);
      }  
  });
}
// *************************************************************************************************
function newSelectOption(selectObject, value, text){ 
  var newOptionElement = document.createElement('option');
  newOptionElement.value = value;
  newOptionElement.innerHTML = text;
  selectObject.appendChild(newOptionElement);
}
// *************************************************************************************************
addCityOptionButton.onclick = function (){
    var divCollection = document.getElementsByTagName('div'); 
    divCollection[0].style.display = "none"; 
    divCollection[1].style.display = "none"; 
    divCollection[2].style.display = "block"; 
    //var newCityDiv = document.getElementsByClassName('newCityClass')[0];
}
// *************************************************************************************************
function f1FormCountriesList(defaultCountry){
  requestToMyServer('GET', 'countries', null, function(responseText){
    //console.log(responseText);
    try {
      var countriesList = JSON.parse( responseText );
    } catch (e) {
      alert("ТРАБЛЫ c countriesList" + e.message);
    }  
    // console.log('Имеем список из '+countriesList.length+' стран.');
    // infoBoxWrite('Имеем список из '+countriesList.length+' стран.');
    var selectCountry = document.getElementsByClassName('selectCountryClass')[0];
    //  заполняем selectCountry полученными с сервера аббревиатурами стран 
    countriesList.forEach(function(item) { 
        newSelectOption(selectCountry, item, item);
    });   
  });  
  var selectCountry = document.getElementsByClassName('selectCountryClass')[0];
  var i = selectCountry.options.length;
  while ((i>0) && (selectCountry.options[i].value!=defaultCountry)) { i--; }
  selectCountry.selectedIndex = i;
  f2FormCitiesList(defaultCountry);
}
// *************************************************************************************************
function f2FormCitiesList(selectedCountry){
  if (!(selectedCountry)) return;
  var selectCity = document.getElementsByClassName('selectCityClass')[0];
  //console.log('Сервер формирует список городов для %s.\nПожалуйста, подождите.', selectedCountry);
  infoBoxWrite('Сервер формирует список городов для '+selectedCountry+'.<br>Пожалуйста, подождите.' );
  selectCity.style.display = "none"; 
  selectCity.previousElementSibling.style.display = "none"; 
  selectCity.nextElementSibling.style.display = "none"; 
  requestToMyServer('GET', 'cities?'+selectedCountry, null, function(responseText){
    //console.log(responseText);
    try {
      var citiesList = JSON.parse( responseText );
    } catch (e) {
      alert("ТРАБЛЫ c citiesList" + e.message);
    }  
    //console.log('Имеем список из %d городов для %s.', citiesList.length, selectedCountry);
    infoBoxWrite('Имеем список из '+citiesList.length+' городов для '+ selectedCountry);
    while (selectCity.lastElementChild) { // удалим старые опции
        //console.log('Сейчас удалим '+selectCity.lastElementChild.value);
        selectCity.removeChild(selectCity.lastElementChild);
      }
    //  заполняем selectCity полученными с сервера названиями городов и их id 
    citiesList.forEach(function(city, i) { 
        newSelectOption(selectCity, city.id, city.name);
    });   
    selectCity.style.display = "inline"; 
    selectCity.previousElementSibling.style.display = "inline"; 
    selectCity.nextElementSibling.style.display = "inline"; 
  });  
}
// *************************************************************************************************
function AddButtonClick(){
  var select2 = document.getElementsByClassName('selectCityClass')[0];
  var option = select2.options[select2.selectedIndex];
  newSelectOption(selectCity1, option.value, option.innerHTML);
  saveOptions();
  cancelButtonClick(); 
}
// *************************************************************************************************
function cancelButtonClick(){
  var divCollection = document.getElementsByTagName('div'); 
  divCollection[0].style.display = "block"; 
  divCollection[1].style.display = "block"; 
  divCollection[2].style.display = "none"; 
  citiesTable = document.getElementsByTagName('table')[0];
  if (citiesTable) { 
  	citiesTable.onmouseover = citiesTable.onmouseout = null; 
  	citiesTable.onclick  = null;
  }
}
// *************************************************************************************************
function adaptableList(objCaller){ 
// - - - - - - - - - - - - - - - -
function onmouseoverhandler(event) {
  var regexp = new RegExp("td", "i");
  if (!(regexp.test(event.target.tagName))) return;
  highlightingElem = event.target.parentElement;
  highlightingElem = event.target.parentElement;
  if (event.type == 'mouseover') {
    highlightingElem.style.background = 'rgba(7, 255, 51, 0.08)';
  }
  if (event.type == 'mouseout') {
    highlightingElem.style.background = ''
  }
} 
// - - - - - - - - - - - - - - - -
function oncklickhandler(event) {
	var citiesTable = main.getElementsByTagName('table')[0];
	var rowIndex = event.target.parentElement.sectionRowIndex;
	var cityId = citiesTable.rows[rowIndex].cells[0].innerHTML;
	var cityName = citiesTable.rows[rowIndex].cells[1].innerHTML;
	var countryAb = citiesTable.rows[rowIndex].cells[2].innerHTML;
	//console.log("CLICK on %s, %s (%s)", cityName, countryAb, cityId);
	if (confirm("Внести город " + cityName + " в список отслеживаемой погоды?")) {
		newSelectOption(selectCity1, cityId, cityName+', '+countryAb);
		saveOptions();
		cancelButtonClick(); 
	}
}
// - - - - - - - - - - - - - - - -
  var PartialName = objCaller.value;
  if (PartialName.length<3) {
  	infoBoxWrite('Для '+PartialName+' выборка будет слишком большой, введите больше букв из названия.');
  	return;
  };
  var myReq = 'findCitiesByPartialName?'+PartialName;
  requestToMyServer('GET', myReq, null, function(responseText){
      //console.log(responseText);
      try { 
        var x = JSON.parse( responseText );  
        infoBoxWrite(' Сформирован список из ' + x.length + ' городов начинающихся на '+objCaller.value);
        delAllDivsInMain();
		var fragment = document.createDocumentFragment();
		var citiesTable = createTableHead(['ID', 'Name', 'Country']);
		// дальше заполняем строки таблицы
		for (var j=0; j < x.length; j++) {
			var trElem = document.createElement('tr');
			var tdArray = [x[j].id, x[j].name, x[j].country];  //{ id:oneCityObj._id, name: oneCityObj.name, country:oneCityObj.country });
			for (var i=0; i<tdArray.length; i++) {
				var tdElem = document.createElement('td');
				tdElem.innerHTML = tdArray[i];
				trElem.appendChild( tdElem );
			}  
			citiesTable.appendChild(trElem);
		}	
		fragment.appendChild(citiesTable);
		createDivInMain(fragment).style.cssText ='display: flex; justify-content: center;';
		citiesTable.onmouseover = citiesTable.onmouseout = onmouseoverhandler;
		citiesTable.onclick  = oncklickhandler;
      } catch (e) {
        alert("ТРАБЛЫ " + e.message);
      }  
  });  
}
// =============================================================================
f1FormCountriesList("UA"); // предварительная загрузка списка стран и списка городов UA










