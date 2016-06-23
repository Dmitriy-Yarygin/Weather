
var rangeForecast = document.getElementsByClassName('rangeForecast')[0];

loadWeatherForCity( selectCity.options[selectCity.selectedIndex].value );


rangeForecast.onchange = function(){  
  var ending = (rangeForecast.value==1) ? 's' : '';
  document.getElementsByClassName('labelForRangeForecast')[0].innerHTML = 
    'Display '+rangeForecast.value+ ' row' + ending + ' forecast '; 
}

requestButton.onclick = function(){
  loadWeatherForCity( selectCity.options[selectCity.selectedIndex].value );
}

function loadWeatherForCity(cityCode) {
  requestButton.innerHTML = 'Weather request for '+ selectCity.options[selectCity.selectedIndex].innerHTML;
  var myReq = (rangeForecast.value==1) ? 'current?' : '5days?';
  myReq+= cityCode;
  requestToMyServer('GET', myReq, null, function(responseText){
      try {
        var x = JSON.parse( responseText );
        show(x, rangeForecast.value); 
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
function show(x, rows) {
  var thArray=['Time', 'Temperature', 'Pressure', 'Humidity', 'Weather'];
  var myDiv = document.createElement('div');
  var el = document.createElement('h3');
  el.innerHTML = x.city.name;
  myDiv.appendChild(el);
  var WeatherTable = document.createElement('table');
  WeatherTable.style.textAlign = "center";
  myDiv.appendChild(WeatherTable);
  // формируем строку с заголовками таблицы TH
  var trElem = document.createElement('tr');
  WeatherTable.appendChild(trElem);
  for (var i=0; i<thArray.length; i++) {
    var el=document.createElement('th'); 
    el.innerHTML= thArray[i];    
    trElem.appendChild(el);
  }
  // формируем строки таблицы с TD
  var fillRowFunction = (rows==1) ? fillRowXdaysWeather : fillRowXdaysWeather;
  for (var j=0; j < rows; j++) {
    trElem = document.createElement('tr');
    WeatherTable.appendChild(trElem);
    for (var i=0; i<thArray.length; i++) {
      trElem.appendChild( document.createElement('td') );
    }  
    fillRowFunction(WeatherTable.rows[j+1], x.list[j]);
  }
  document.getElementsByClassName('container')[0].appendChild(myDiv);
}
  
  function fillRowXdaysWeather(WeatherTableRow, xlistj){
    WeatherTableRow.cells[0].innerHTML = xlistj.dt_txt;
    WeatherTableRow.cells[1].innerHTML = xlistj.main.temp
    WeatherTableRow.cells[2].innerHTML = xlistj.main.pressure
    WeatherTableRow.cells[3].innerHTML = xlistj.main.humidity
    WeatherTableRow.cells[4].innerHTML = xlistj.weather[0].description;
  }




saveOptionsButton.onclick = function(){ 
// чтобы сохранить текущий список опций из селекта делаем json
  var obj = selectCity.options[0];
  var body = '[{"value":"'+obj["value"]+'", "text":"'+obj["text"]+'"}';
  for (var i=1; i<selectCity.options.length; i++) {
    obj = selectCity.options[i];
    body+=',{"value":"'+obj["value"]+'", "text":"'+obj["text"]+'"}';
  }
  body+=']';
  //console.log(body); 
  var myReq = '/saveOptions?';
  requestToMyServer('POST', myReq, body, function(responseText){
    console.log('Ответ сервера на запрос записи опций:\n'+responseText);
  });
}

loadOptionsButton.onclick = function(){ 
// получаем с моего сервера json с опциями для селекта
  var myReq = '/loadOptions?';
  requestToMyServer('GET', myReq, null, function(responseText){
      try {
        var newOptionsArray = JSON.parse( responseText );  
        console.log ('Успешно получили с сервера опции для селекта'+responseText);
        while (selectCity.lastElementChild) { // удалим старые опции
          console.log('Сейчас удалим '+selectCity.lastElementChild.value);
          selectCity.removeChild(selectCity.lastElementChild);
        }
        var newOptionElement; // добавим полученные с сервера опции
        for (var i=0; i<newOptionsArray.length; i++) {
            newOptionElement = document.createElement('option');
            newOptionElement.value = newOptionsArray[i].value;
            newOptionElement.innerHTML = newOptionsArray[i].text;
            selectCity.appendChild(newOptionElement);
        }    
      } catch (e) {
        alert("Сложности с JSON.parse опций для селекта " + e.message);
      }  
  });

}





