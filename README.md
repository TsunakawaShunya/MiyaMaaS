# MiyaMaaS


## 背景
私は生まれてから現在まで栃木県に住んでいるのですが、完全な車社会で移動に不便さを常に感じていました。また、今年の夏に、私の大学が所在する栃木県宇都宮市にLRTと呼ばれる路面電車が開通されました。この機会に地域内交通に関するMaaSに関心を抱き、1つのアプリでまとめて市内の交通や周辺情報がわかるようにしたいと考えていました。研究とは全く無関係ですが、まずは第一歩として経路案内の実装を進めています。未実装の部分が多いですが、途中経過としてあげさせていただきます。


## 使い方
地図が表示されない場合は再読み込みしてください. 
本アプリケーションはモバイル端末の利用を想定しています.


1. 出発地、目的地を入力またはピンまたは検索で設定してください
検索入力では[出発地]から[目的地]まで」と音声または手入力をしてください
※ジオコーディングによって地点を設定するため，なるべく細かく施設名を入力してください

2. 検索ボタンを押すと経路の一覧が表示されます

3. 一覧の中から経路を選択すると詳細ページに飛べます

4. 案内開始ボタンで経路案内を受けることができます
※未実装


## 課題
- デザイン
  - 機能面を優先したのでデザインはまだまだこだわった方がいいと考えています。

- 機能
  - 絞り込みや検索結果のソート
  - 音声認識や文字入力で検索(テキストにはできますが、その入力からどのように検索するか)
  - 経路案内の実装
  - 宇都宮市内のお店が周辺情報として広告できるような機能
  - 電子マネーとの連携
