const mixwayAPIKey = "test_rzuJ8evmpRh"; // アクセスキー

const apiBaseUrl = "https://mixway.ekispert.jp/v1/json";    // APIエンドポイントのベースURL

// 各APIエンドポイントのパスを設定
const routeSearchEndpoint = "/search/course/extreme";   // API名: 経路探索
const patternSearchEndpoint = "/search/course/pattern"; // API名: 前後のダイヤ探索
const realTimeRouteSearchEndpoint = "/realtime/search/course/extreme";  // API名: 経路探索（リアルタイム）
const realTimePatternSearchEndpoint = "/realtime/search/course/pattern";    // API名: 前後のダイヤ探索（リアルタイム）
const stationInfoEndpoint = "/station"; // API名: 駅情報
const lightStationInfoEndpoint = "/station/light";  // API名: 駅簡易情報
const courseStationInfoEndpoint = "/course/station";    // API名: 区間の駅情報
const passStationInfoEndpoint = "/course/passStation";  // API名: 通過駅情報
const trainStationInfoEndpoint = "/course/trainStation";    // API名: 列車等の停車駅情報
const routeShapeInfoEndpoint = "/course/shape"; // API名: 経路探索結果のシェイプ情報
const courseEditEndpoint = "/course/edit";  // API名: 経路の再現／定期券・指定列車利用
const geoPointSearchEndpoint = "/geo/point";    // API名: 緯度経度からポート情報の検索
const pointDetailInfoEndpoint = "/point/detail";    // API名: ポート名や駅名の詳細情報
const lightPointInfoEndpoint = "/point/light";  // API名: ポート名や駅名の簡易情報
const railInfoEndpoint = "/rail";   // API名: 平均路線情報
const corporationInfoEndpoint = "/corporation"; // API名: 会社情報
const courseConditionToolEndpoint = "/toolbox/course/condition";    // API名: 探索条件生成
const dataVersionEndpoint = "/dataversion"; // API名: バージョン情報



// 出発地、到着地の座標
let departureLat = null;
let departureLng = null;
let arrivalLat = null;
let arrivalLng = null;

// Google Map用
let map;
let departureMarker;    // 出発ピン
let arrivalMarker;    // 到着ピン

let courses;  // 取ってきた経路情報

const depatureIcon = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';    //出発地アイコン
const arrivalIcon = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';    //到着地アイコン


const searchResultContainer = document.getElementById("search-result-container");   // 検索結果コンテナ
let eventMarkers= [];

// 入力
const departureInput = document.getElementById('departure-input');
const arrivalInput = document.getElementById('arrival-input');


// Google Map
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 36.55914402240469, lng: 139.89844036622222 }, // 宇都宮駅
      zoom: 13,
  });
  

  // 出発地のデフォルト座標を設定（現在の位置）
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      departureMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        title: '出発地',
        icon: depatureIcon,
      });

      // 出発地の座標を取得
      departureLat = userLocation.lat;
      departureLng = userLocation.lng;
    });
  }

  // 到着地のデフォルト座標を設定（宇都宮駅）
  arrivalLat = 36.55914402240469;
  arrivalLng = 139.89844036622222;
  arrivalMarker = addMarker(map,arrivalLat,arrivalLng,'到着地',arrivalIcon );


  // マップがクリックされたとき
  map.addListener('click', function(event) {
    let isDeparture = document.getElementById('departure-radio').checked;
    let isArrival = document.getElementById('arrival-radio').checked;

    if (isDeparture) {
      // 既存の出発地ピンを削除
      if (departureMarker) {
        departureMarker.setMap(null);
      }
    
      // 出発地の座標を取得
      departureLat = event.latLng.lat();
      departureLng = event.latLng.lng();
    
      // マーカーを追加
      departureMarker = addMarker(map, departureLat, departureLng, '出発地', depatureIcon);
    
      // 出発地のinputタグに座標を記入
      departureInput.value = departureLat + ', ' + departureLng;
    } else if (isArrival) {
      // 既存の到着地ピンを削除
      if (arrivalMarker) {
        arrivalMarker.setMap(null);
        // イベント情報削除
        eventMarkers.forEach(marker => {
          marker.setMap(null);
        });
        eventMarkers = [];     
      }

    
      // 到着地の座標を取得
      arrivalLat = event.latLng.lat();
      arrivalLng = event.latLng.lng();
      // マーカを追加
      arrivalMarker = addMarker(map, arrivalLat, arrivalLng, '到着地', arrivalIcon);
    
      // 到着地のinputタグに座標を記入
      arrivalInput.value = arrivalLat + ', ' + arrivalLng;
    }
  });

  // 出発地が入力されたとき
  departureInput.addEventListener('change', () => {
    if (typeof departureInput.value === 'string' && departureInput.value !== '') {
      // 入力が文字列だった場合ジオコーディング
      geocoder(departureInput.value, function (result) {
        departureLat = result.lat;
        departureLng = result.lng;
        // ピンを更新
        if (departureMarker) {
          departureMarker.setMap(null);
        }
        departureMarker = addMarker(map, departureLat, departureLng, '出発地', depatureIcon);
        // 新しい座標を使用して経路を再度検索
        searchForRoutes();
      });
    }
  });


  // 到着地が入力されたとき
  arrivalInput.addEventListener('change', () => {
    // イベント情報削除
    eventMarkers.forEach(marker => {
      marker.setMap(null);
    });
    eventMarkers = [];

    // ジオコーディング
    if (typeof arrivalInput.value === 'string' && arrivalInput.value !== '') {
      geocoder(arrivalInput.value, function (result) {
        arrivalLat = result.lat;
        arrivalLng = result.lng;
        // ピンを更新
        if (arrivalMarker) {
          arrivalMarker.setMap(null);
        }
        arrivalMarker = addMarker(map, arrivalLat, arrivalLng, '到着地', arrivalIcon);
      });
    }
  });


  // 検索ボタンがクリックされたとき
  const searchButton = document.getElementById('search-button');
  searchButton.addEventListener('click', () => {
    if (existingPolylines.length > 0) {
      clearRouteLines();
    }
    
    // 新しい座標を使用して経路を再度検索
    request(departureLat, departureLng, arrivalLat, arrivalLng)
      .then(data => {
        //recommandInformation();
        displayRouteList(data);
        return serializeData(data);
      })
      .then(routeData => {
        return Promise.resolve(routeData);
      })
      .then(data => {
        // 新しい経路を地図上に描画
        drawRoutesOnMap(map, data);
      })
      .catch(error => {
        console.error('APIリクエストエラー:', error);
      });
  });
}


//マーカー立てる関数
function addMarker(map, lat, lng, title, icon){
  const marker = new google.maps.Marker({
    map: map,
    position: new google.maps.LatLng(lat,lng),
    title: title ,
    icon: icon,
  });
  if (marker) {
    console.log(title + ' マーカーが追加されました。');
  } else {
    console.error(title + ' マーカーの追加に失敗しました。');
  }
  return marker;
}




// 住所や地名から緯度経度に変換（ジオコーディング）
function geocoder(address, callback) {
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ 'address': address }, function(results, status) {
    if (status === 'OK' && results.length > 0) {
      const location = results[0].geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      callback({ lat, lng });
      console.log(lat, ",", lng);
    } else {
      console.log('ジオコーディングエラー: ' + status);
      callback(null);
    }
  });
}


// 詳細探索条件データを返す
// fetchが非同期だからうまくいってない（デフォルトが返ってしまう）
function returnCondition() {
  // 詳細探索条件データ
  let conditionStr = 'T32212332323191:F33211221200001:A23121141:';

  const busCheckbox = document.getElementById("busCheckbox");
  if(busCheckbox.checked) {
    const requestUrl = `${apiBaseUrl}${courseConditionToolEndpoint}?key=${mixwayAPIKey}&localBusOnly=true`;
    fetch(requestUrl)
      .then(response => {
        if (!response.ok) {
          throw Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        conditionStr = data.ResultSet.Condition;
      })
      .catch(error => {
        console.error('APIリクエストエラー（経路条件探索）:', error);
      });
  }

  return conditionStr;

}






//APIをリクエストする関数
function request(departureLat, departureLng, arrivalLat, arrivalLng) {
  return new Promise((resolve, reject) => {
    const requestUrl = `${apiBaseUrl}${routeSearchEndpoint}?key=${mixwayAPIKey}&viaList=${departureLat},${departureLng}:${arrivalLat},${arrivalLng}`;
    fetch(requestUrl)
      .then(response => {
        if (!response.ok) {
          throw Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // JSONデータからコース情報を取得
        resolve(data.ResultSet.Course); // コース情報を解決
      })
      .catch(error => {
        console.error('APIリクエストエラー:', error);
        reject(error); // エラーを拒否
      });
  });
}
  
  
serializeJSON = [];
// シリアライズ経路データを持ってくる
async function serializeData(data) {
  serialize_list = [];
  serialize_list = data.map(data => data.SerializeData);
  shape_list = [];
  for (let i = 0; i < serialize_list.length; i++) {
    try {
      const shape = await fetchRouteData(serialize_list[i]);
      shape_list.push(shape);
    } catch (error) {
      console.error('エラー:', error);
    }
  }
  serializeJSON = shape_list;
  return serializeJSON;
}

// 経路のシェイプ情報をもってくる
function fetchRouteData(serializeData) {
  return new Promise((resolve, reject) => {
    const requestURL = `${apiBaseUrl}${routeShapeInfoEndpoint}?key=${mixwayAPIKey}&serializeData=${serializeData}`;
    fetch(requestURL)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const routeShape = data;
        resolve(routeShape);
      })
      .catch(error => {
        reject(error);
      });
  });
}

let existingPolylines = [];
// 経路を地図上に描画する関数
function drawRoutesOnMap(map, data) {
  // 各経路に対して処理を行う
  data.forEach(function (route) {
    let course = route.ResultSet.Course.Line;
    course.forEach(function (segment) {
        let coordinates = segment.Element[0].Shape.map(function (point) {
            return {
                lat: parseFloat(point.GeoPoint.lati_d),
                lng: parseFloat(point.GeoPoint.longi_d)
            };
        });

        let color;
        if (segment.Type.text === "walk") {
          color = 'gray';
        } else if (segment.Type.text === "bus") {
          color = 'blue';
        } else if (segment.Type.text === "train") {
          color = 'green';
        } 

        let routePath = new google.maps.Polyline({
            path: coordinates,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 1.0,
            strokeWeight: 5,
            map: map
        });
        // 描画したポリラインを配列に追加
        existingPolylines.push(routePath);
    });
  });
}
  
// 既存のポリラインをクリアする関数
function clearRouteLines() {
  for (const polyline of existingPolylines) {
    polyline.setMap(null); // ポリラインを地図から削除
  }
  existingPolylines = []; // 配列を空にする
}

// 結果を一覧表示する関数
function displayRouteList(courseData) {
  courses = courseData;
  const resultHTML = [];
  
  // 最大で5つの経路情報を表示
  for (let i = 0; i < Math.min(courses.length, 5); i++) {
    const course = courses[i];
    
    // 経路情報
    const stationInfo = [];
    for (let j = 0; j < course.Route.Point.length; j++) {
      if (course.Route.Point[j].Station) {
        stationInfo.push(course.Route.Point[j].Station.Name);
      }
    }

    // 出発時刻と到着時刻
    const departureTime = course.Route.Line[0].ArrivalState.Datetime.text.split('T')[1].substring(0, 5); // 0番目の Line に出発時刻があります
    const arrivalTime = course.Route.Line[course.Route.Line.length - 1].ArrivalState.Datetime.text.split('T')[1].substring(0, 5); // 最後の Line に到着時刻があります

    // 合計金額
    let fareSummaryIndex = -1; // fareSummaryのインデックス
    for (let index = 0; index < course.Price.length; index++) {
      if (course.Price[index].kind === "FareSummary") {
        fareSummaryIndex = index;
        break;
      }
    }
    const totalPrice = course.Price[fareSummaryIndex].Oneway;   // 合計金額

    // list中身
    const routeInfo = `
      <div class="result-list" data-index="${i}">
        <div class='number'>
          <p>${i + 1}</p>
        </div>
        <div class='route-info'>
          <div class = 'time'><p>${departureTime} → ${arrivalTime}</p></div>
          <p>経路: 出発地 → ${stationInfo.join(" → ")} → 目的地</p>
          <p><i class="fa-solid fa-wallet"></i> ${totalPrice} 円</p>
        </div>
        <div class='allow'>
          <i class="fa-solid fa-chevron-right"></i>
        </div>
      </div>
    `;
    resultHTML.push(routeInfo);
  }

  searchResultContainer.innerHTML = resultHTML.join('');
  // 検索結果コンテナを表示する
  searchResultContainer.style.display = "block";

  // 詳細ボタンのクリックイベントを設定
  const resultLists = document.querySelectorAll('.result-list');
  resultLists.forEach((resultList, i) => {
    // 経路候補の詳細を見る
    resultList.addEventListener('click', () => {
      displayRouteDetails(courses[i]);
      // "案内を開始" ボタンのクリックイベントを設定
      const guideStartButton = document.getElementById("guide-start-button");
      guideStartButton.addEventListener('click', () => {
        startNavigation(courses[i]);
      });
    });
  });
}


// 経路詳細の表示関数
function displayRouteDetails(course) {
  const detailHTML = [];    //detailの中身
  // 出発日
  let departureDate = course.Route.Line[0].ArrivalState.Datetime.text.split('T')[0].split('-');   // （例）"2023-10-27"
  const departureMonth = departureDate[1];    //出発月（例）10
  const departureDay = departureDate[2];    // 出発日（例）27
  departureDate = `${departureMonth}月${departureDay}日`    //出発日付
  const departureTime = course.Route.Line[0].DepartureState.Datetime.text.split('T')[1].substring(0, 5);    //出発時刻
  const arrivalTime = course.Route.Line[course.Route.Line.length - 1].ArrivalState.Datetime.text.split('T')[1].substring(0, 5); // 到着時刻
  // 合計金額部分
  let fareSummaryIndex = -1; // fareSummaryのインデックス
  for (let index = 0; index < course.Price.length; index++) {
    if (course.Price[index].kind === "FareSummary") {
      fareSummaryIndex = index;
      break;
    }
  }
  const totalPrice = course.Price[fareSummaryIndex].Oneway;   // 合計金額

  // 全体情報
  detailHTML.push(`
    <div id="result-detail-entire">
      <button id="goto-lists-button"><<一覧へ</button></br>
      <p>${departureDate}   ${departureTime} → ${arrivalTime}</p>
      <p><i class="fa-solid fa-wallet"></i> ${totalPrice} 円</p>
    </div>
  `);

  // 詳細情報    
  for (let i = 0; i <= course.Route.Line.length; i++) {    
    if (i == 0) {
      // はじめは出発時刻と出発地のみ
      const pointName = course.Route.Point[i].Name;   // 出発地
      const pointDepartureTime = course.Route.Line[i].DepartureState.Datetime.text.split('T')[1].substring(0, 5);    // Lineの出発時刻
      const lineName = course.Route.Line[i].Name;   // 経路名

      detailHTML.push(`
        <div class="result-detail">
          <div class= 'detail_container'>
            <div class="time time-container">
              ${pointDepartureTime} 
            </div>
            <div class="point">
              ${pointName}
            </div>
          </div>
          <div class="line">
            ${lineName}
          </div>
        </div>
      `);
    } else if (i == course.Route.Line.length) {
      // 最後は到着時刻と目的地のみ
      const pointName = course.Route.Point[i].Name;   // 目的地
      const pointArrivalTime = course.Route.Line[i - 1].ArrivalState.Datetime.text.split('T')[1].substring(0, 5);    // 1つ前のLineにおける到着時刻
    
      detailHTML.push(`
        <div class="result-detail">
          <div class= 'detail_container'>
            <div class="time time-container">
              ${pointArrivalTime} </br>
            </div>
            <div class="point">
              ${pointName}</br>
            </div>
          </div>
          
        </div>
      `);
    } else if (course.Route.Point[i].Station == null) {
      // 徒歩
      const pointName = course.Route.Point[i].Name;   // 地点の名称
      const pointArrivalTime = course.Route.Line[i - 1].ArrivalState.Datetime.text.split('T')[1].substring(0, 5);    // 1つ前のLineにおける到着時刻
      const pointDepartureTime = course.Route.Line[i].DepartureState.Datetime.text.split('T')[1].substring(0, 5);    // Lineの出発時刻
      const lineName = course.Route.Line[i].Name;   // 経路名

      detailHTML.push(`
        <div class="result-detail">
          <div class= 'detail_container'>
            <div class="time time-container">
              ${pointArrivalTime} </br>
              ${pointDepartureTime} </br>
            </div>
            <div class="point">
              ${pointName}
            </div>
          </div>
          <div class="line">
            <p><i class="fa-solid fa-person-walking"></i></p>${lineName}
          </div>
        </div>
      `);
    }
    else {
      // その他
      const pointName = course.Route.Point[i].Station.Name;   // 地点の名称
      const nodeArrivalTime = course.Route.Line[i - 1].ArrivalState.Datetime.text.split('T')[1].substring(0, 5);    // 1つ前のLineにおける到着時刻
      const nodeDepartureTime = course.Route.Line[i].DepartureState.Datetime.text.split('T')[1].substring(0, 5);    // Lineの出発時刻
      const lineName = course.Route.Line[i].Name;   // 経路名

      detailHTML.push(`
        <div class="result-detail">
        <div class= 'detail_container'>
          <div class="time time-container">
            ${nodeArrivalTime} </br>
            ${nodeDepartureTime} </br>
          </div>
          <div class="point">
            ${pointName}
          </div> 
        </div>
          
          <div class="line">
            ${lineName}
          </div>
        </div>
      `);
    }
  }
  
  // 案内を開始ボタン
  detailHTML.push(`
    <div id="detail-button-area">
      <button id="guide-start-button"><i class="fa-solid fa-route"></i> 案内を開始</button>
    </div>
  `) ;

  // 詳細情報をsearchResultContainerに表示
  searchResultContainer.innerHTML = detailHTML.join('');
  // 検索結果コンテナを表示
  searchResultContainer.style.display = "block";

  // 「一覧へ」で経路リストへ戻る
  const gotoListsButton = document.getElementById("goto-lists-button");
  gotoListsButton.addEventListener('click', () => {
    displayRouteList(courses);
  });

}


// 周辺のおすすめ情報表示
function recommandInformation() {
  // APIで取りたい
  const recomendationIcon = 'https://maps.google.com/mapfiles/ms/micons/ltblu-pushpin.png';    // おすすめスポットのピン
  const recommendations = [
    { name: 'バスケットボール 3×3 Exibition', location: 'オリオンスクエア（〒320-0802 栃木県宇都宮市江野町８−３）', 
    description: 'オリオンスクエアでバスケットボールの 3×3カップが開催中！アプリの提示で生ビール１本無料プレゼント！！', image: '../img/basketball.jpg' ,lat: '36.560484210838254', lng: '139.88240137301415',
    map: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3204.755959103913!2d139.87975701186488!3d36.55999678108683!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x601f67bb880df487%3A0x7ff1dfffa872bc66!2z44Kq44Oq44Kq44Oz44K544Kv44Ko44KiKOWuh-mDveWuruW4guOCquODquOCquODs-W4guawkeW6g-WgtCk!5e0!3m2!1sja!2sjp!4v1699598200140!5m2!1sja!2sjp" " allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
    icon: recomendationIcon},
    { name: '宇都宮フリーマーケット', location: '宇都宮二荒山神社（〒320-0026 栃木県宇都宮市馬場通り１丁目１−１）', description: '二荒山神社で年に一度のフリーマーケットが開催中！掘り出し物ゲットできるかも！', lat: '36.56277178628818', lng: '139.88575362698583',
    image: '../img/free.jpg',map : '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3204.6567501388995!2d139.88324347630137!3d36.562388481068126!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x601f67a4c9f2a7dd%3A0x3763927d31862f08!2z5a6H6YO95a6u5LqM6I2S5bGx56We56S-!5e0!3m2!1sja!2sjp!4v1699598849578!5m2!1sja!2sjp" " allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
    icon: recomendationIcon},
    { name: 'Miya Cafe', location: '宇都宮城址公園(〒320-0817 栃木県宇都宮市本丸町1-3520外)', description: 'Miya Cafe が新しいメニューを開発！午後の一息に暖かいコーヒーはいかが？', image: '../img/cafe.jpg' ,lat: '36.556210288566014', lng: '139.88520966137108',
    map:'<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12819.90939157757!2d139.8850377359609!3d36.55465912102357!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x601f679785d82d4d%3A0x15de47dd70284b76!2z5a6H6YO95a6u5Z-O5Z2A5YWs5ZyS!5e0!3m2!1sja!2sjp!4v1699599270334!5m2!1sja!2sjp" "allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
    icon: recomendationIcon},
  ];

  const recommendationHTML = []; // 配列を初期化
  recommendationHTML.push(`
    <h2 id="recommended-popup">あなたにおすすめのイベント情報</h2>
  `);

  for (let i = 0; i < recommendations.length; i++) {
    recommendationHTML.push(`
      <div class="recommendation">
        <h3>${recommendations[i].name}</h3>
        <div class="recommendation-item">
          <div class="recommendation-item1">
            <img src="${recommendations[i].image}" alt="${recommendations[i].name}">
          </div>
          <div class="recommendation-item2">
            <p><i class="fa-solid fa-map-pin"></i> ${recommendations[i].location}</p>
            <div class="recommendation-map">${recommendations[i].map}</div>
            <p><i class="fa-solid fa-circle-info"></i> ${recommendations[i].description}</p>
          </div>
        </div>
      </div>
    `);

    addMarker(map, recommendations[i].lat, recommendations[i].lng, recommendations[i].name, recommendations[i].icon)
  }


  // 配列を文字列に結合して表示
  const recommendInformation = document.getElementById("recommend-information");
  recommendInformation.innerHTML = recommendationHTML.join('');
}



// --------------------やるところ---------------------
/* 残り */
/* 経路詳細、検索、経路図示、条件絞り込み、並び替え */

// 経路案内の関数
function startNavigation(course) {
  console.log(course);
}


// -------------------------------------------------------------------------------------------------------------------
// ハンバーガーメニュー
document.addEventListener("DOMContentLoaded", function () {
    const hamburgerMenu = document.getElementById("hamburger-menu");
    const menuContainer = document.getElementById("menu-container");

    hamburgerMenu.addEventListener("click", function () {
        menuContainer.style.top = (hamburgerMenu.offsetTop + hamburgerMenu.offsetHeight) + "px";
        menuContainer.classList.toggle("hidden");
    });
});



// 条件をチェック
document.addEventListener("DOMContentLoaded", function () {
    const transportOptions = document.querySelectorAll(".transport-option input[type='checkbox']");

    transportOptions.forEach(function (option) {
        option.addEventListener("click", function () {
            const label = option.parentElement; // チェックボックスの親要素の<label>要素を取得

            if (option.checked) {
                label.style.backgroundColor = "#eee8aa"; // チェックがオンの場合、背景をオレンジに
            } else {
                label.style.backgroundColor = "white"; // チェックがオフの場合、背景をデフォルトに戻す
            }
        });
    });
});



// 音声入力
const voiceInputButton = document.getElementById("voice-input-button");
const searchInput = document.getElementById("search-input");
document.addEventListener("DOMContentLoaded", function () {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'ja-JP'; // 言語を設定（日本語）

        voiceInputButton.addEventListener("click", function () {
          recognition.start(); // 音声認識を開始

            recognition.onresult = function (event) {
              const transcript = event.results[0][0].transcript;
              searchInput.value = transcript; // 音声をテキストボックスに設定
              registInput();
            }

            recognition.onend = function () {
              recognition.stop();
            }

            recognition.onerror = function (event) {
              console.error('音声認識エラー', event.error);
            }
        });
    } else {
        console.error('Web Speech APIはサポートされていません');
    }
});

// 検索入力を出発地と到着地に登録
function registInput() {
  const madeIndex = searchInput.value.indexOf('から');       // 「から」のindex
  const karaIndex = searchInput.value.indexOf('まで');        // 「まで」のindex

  // イベント情報削除
  eventMarkers.forEach(marker => {
    marker.setMap(null);
  });
  eventMarkers = [];
  
  // 「から」と「まで」が検索文字列に含まれているとき
  if (madeIndex !== -1 && karaIndex !== -1) {
    const departure = searchInput.value.substring(0, madeIndex).trim();
    const arrival = searchInput.value.substring(madeIndex + 2, karaIndex).trim();
        
    departureInput.value = departure;
    arrivalInput.value = arrival;
  } else {
    resultDisplay.textContent = "「[出発地]から[目的地]まで」とお声かけください（例：宇都宮大学から栃木県庁まで）";
  }

  if (typeof departureInput.value === 'string' && departureInput.value !== '') {
    // 入力が文字列だった場合ジオコーディング
    geocoder(departureInput.value, function (result) {
      departureLat = result.lat;
      departureLng = result.lng;
      // ピンを更新
      if (departureMarker) {
        departureMarker.setMap(null);
      }
      departureMarker = addMarker(map,departureLat,departureLng,'出発地',depatureIcon);
    });
  }

  if (typeof arrivalInput.value === 'string' && arrivalInput.value !== '') {
    // 到着地のジオコーディング
    geocoder(arrivalInput.value, function (result) {
      arrivalLat = result.lat;
      arrivalLng = result.lng;
      // ピンを更新
      if (arrivalMarker) {
        arrivalMarker.setMap(null);
      }
      arrivalMarker = addMarker(map,arrivalLat,arrivalLng,'到着地',arrivalIcon);    
    });
  }
}


searchInput.addEventListener('change', () => {
  registInput();
})


// 出発・到着の選択
const departureButton = document.getElementById("departure-radio");
const arrivalButton = document.getElementById("arrival-radio");

departureButton.addEventListener("click", function () {
    if (departureButton.checked) {
        document.querySelector("label[for='departure-radio']").style.backgroundColor = "pink";
        document.querySelector("label[for='arrival-radio']").style.backgroundColor = "";
    }
});

arrivalButton.addEventListener("click", function () {
    if (arrivalButton.checked) {
        document.querySelector("label[for='arrival-radio']").style.backgroundColor = "lightblue";
        document.querySelector("label[for='departure-radio']").style.backgroundColor = "";
    }
});
