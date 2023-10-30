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
document.addEventListener("DOMContentLoaded", function () {
    const voiceInputButton = document.getElementById("voice-input-button");
    const searchInput = document.getElementById("search-input");
    const resultDisplay = document.getElementById("result-display"); // 結果を表示する要素

    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'ja-JP'; // 言語を設定（日本語）

        voiceInputButton.addEventListener("click", function () {
            recognition.start(); // 音声認識を開始

            recognition.onresult = function (event) {
                const transcript = event.results[0][0].transcript;
                searchInput.value = transcript; // 音声をテキストボックスに設定
            }

            recognition.onend = function () {
                recognition.stop();
            }

            recognition.onerror = function (event) {
                console.error('音声認識エラー', event.error);
                resultDisplay.textContent = "エラーが発生しました: " + event.error;
            }
        });
    } else {
        console.error('Web Speech APIはサポートされていません');
        resultDisplay.textContent = "Web Speech APIはサポートされていません";
    }
});

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
