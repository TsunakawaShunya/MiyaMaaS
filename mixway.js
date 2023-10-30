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
  

  const departureInput = document.getElementById('departure-input');
  const arrivalInput = document.getElementById('arrival-input');

  // マップがクリックされたとき
  map.addListener('click', function(event) {
    var isDeparture = document.getElementById('departure-radio').checked;
    var isArrival = document.getElementById('arrival-radio').checked;

    if (isDeparture) {
      // 既存の出発地ピンを削除
      if (departureMarker) {
        departureMarker.setMap(null);
      }
      

      // 出発地の座標を取得
      departureLat = event.latLng.lat();
      departureLng = event.latLng.lng();

      
      //マーカ-を追加
      departureMarker = addMarker(map,departureLat,departureLng,'出発地',depatureIcon);

      // 出発地のinputタグに座標を記入
      departureInput.value = departureLat + ', ' + departureLng;
    } else if (isArrival) {
      // 既存の到着地ピンを削除
      if (arrivalMarker) {
        arrivalMarker.setMap(null);
      }
  
      // 到着地の座標を取得
      arrivalLat = event.latLng.lat();
      arrivalLng = event.latLng.lng();     
      // マーカを追加
      arrivalMarker = addMarker(map,arrivalLat,arrivalLng,'到着地',arrivalIcon);


      // 到着地のinputタグに座標を記入
      arrivalInput.value = arrivalLat + ', ' + arrivalLng;
    }
  });

  // 検索ボタンがクリックされたときの処理
  const searchButton = document.getElementById('search-button');
  // 検索を押したら
  searchButton.addEventListener('click', () => {
    const departureInput = document.getElementById('departure-input').value;
    const arrivalInput = document.getElementById('arrival-input').value;

    console.log(departureLat, ",", departureLng);
    console.log(departureInput.value);
    console.log(arrivalInput.value);

    if (departureInput.value !== undefined && arrivalInput.value !== undefined) {
      // 入力が文字列だった場合ジオコーディング
      if (typeof departureInput === 'string' && typeof arrivalInput === 'string') {
        // 出発地のジオコーディング
        geocoder(departureInput, function (result) {
          departureLat = result.lat;
          departureLng = result.lng;
  
          // 到着地のジオコーディング
          geocoder(destinationInput, function (result) {
            arrivalLat = result.lat;
            arrivalLng = result.lng;
  
            request(departureLat, departureLng, arrivalLat, arrivalLng);
            departureMarker = addMarker(map,departureLat,departureLng,'出発地',depatureIcon);
            arrivalMarker = addMarker(map,arrivalLat,arrivalLng,'到着地',arrivalIcon);
          });
        });
      } else {
        // 緯度経度だったらそのままリクエスト
        request(departureLat, departureLng, arrivalLat, arrivalLng);
        departureMarker = addMarker(map,departureLat,departureLng,'出発地',depatureIcon);
        arrivalMarker = addMarker(map,arrivalLat,arrivalLng,'到着地',arrivalIcon);
      }
    } else {
      // 入力なしの場合、デフォルトで経路検索
      request(departureLat, departureLng, arrivalLat, arrivalLng);
      departureMarker = addMarker(map,departureLat,departureLng,'出発地',depatureIcon);
      arrivalMarker = addMarker(map,arrivalLat,arrivalLng,'到着地',arrivalIcon);
    }
  });
}


//マーカー立てる関数
function addMarker(map,lat,lng,title, icon){
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


//住所や地名から緯度経度に変換（ジオコーディング）
function geocoder(address, callback) {
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ 'address': address }, function(results, status) {
    if (status === 'OK' && results[0]) {
      const location = results[0].geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      callback({ lat, lng });
    } else {
      console.log('ジオコーディングエラー: ' + status);
      callback(null); 
    }
  });
}


//APIをリクエストする関数
function request(departureLat, departureLng, arrivalLat, arrivalLng) {
  // URLリクエストの例
  // https://mixway.ekispert.jp/v1/json/search/course/extreme?key=[アクセスキー]&viaList=35.6585805,139.7454329:35.6715869,139.6967028
  const requestUrl = `${apiBaseUrl}${routeSearchEndpoint}?key=${mixwayAPIKey}&viaList=${departureLat},${departureLng}:${arrivalLat},${arrivalLng}`;
  fetch(requestUrl)
    .then(response => {
      if (!response.ok) {
        throw Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log(data);
      // JSONデータからコース情報を取得
      displayRouteList(data.ResultSet.Course);
    })
    .catch(error => {
      console.error('APIリクエストエラー:', error);
    });
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
        <p>ID: ${i}</p>
        <p>
          ${departureTime} -> ${arrivalTime}
        </p>
        <p>経路: 出発地→${stationInfo.join("→")}→目的地</p>
        <p>金額: ${totalPrice}  円</p>
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


// ----------------デザインと行のずれ、移動方法------------------------
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
      <p>${totalPrice} 円</p>
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
          <div class="time">
            ${pointDepartureTime} 発
          </div>
          <div class="point">
            ${pointName}
          </div>
          <div class="line">
            <br>
            <br>
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
          <div class="time">
            ${pointArrivalTime} 着</br>
          </div>
          <div class="point">
            ${pointName}</br>
          </div>
          <div class="line">
            <!-- 空の <div class="line"> を挿入 -->
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
          <div class="time">
            ${pointArrivalTime} 着</br>
            ${pointDepartureTime} 発</br>
          </div>
          <div class="point">
            ${pointName}
          </div>
          <div class="line">
            <br>
            <br>
            ${lineName}
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
          <div class="time">
            ${nodeArrivalTime} 着</br>
            ${nodeDepartureTime} 発</br>
          </div>
          <div class="point">
            ${pointName}
          </div> 
          <div class="line">
            <br>
            <br>
            ${lineName}
          </div>
        </div>
      `);
    }
  }
  
  // 案内を開始ボタン
  detailHTML.push(`
    <div id="detail-button-area">
      <button id="guide-start-button">案内を開始</button>
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


// --------------------やるところ---------------------
// 経路案内の関数
function startNavigation(course) {
  console.log(course);
}


/* 残り */
/* 経路詳細、検索、経路図示、条件絞り込み、並び替え */