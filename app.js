const firebaseConfig = {            
    apiKey: "AIzaSyDzkv4MyzI1RF9KRPyerJywEtLv427T6DE",            
    authDomain: "project-6180622403440470920.firebaseapp.com",            
    databaseURL: "https://project-6180622403440470920-default-rtdb.firebaseio.com",            
    projectId: "project-6180622403440470920",            
    storageBucket: "project-6180622403440470920.firebasestorage.app",            
    messagingSenderId: "626753939152",            
    appId: "1:626753939152:web:485e286ff8e5b596bf20d5",            
    measurementId: "G-QMSFMGJG0J"        
};                
firebase.initializeApp(firebaseConfig);                                

// 🚨 구글 앱스 스크립트 '새 버전 배포' 후 획득한 주소를 여기에 꼭 업데이트하세요!
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwOBYoNRvxu3oXoJpyoBzFcwVTiF1EV4trcmQ0KMT7ru6PoRUDLkiOpjvdSjSaltMtH/exec";                                

let currentSolutionText = ""; 
const provider = new firebase.auth.GoogleAuthProvider();                                

function toggleLogin() {                        
    const user = firebase.auth().currentUser;                        
    if (!user) { firebase.auth().signInWithPopup(provider).catch(e => console.error(e)); } 
    else { firebase.auth().signOut(); }
}                

firebase.auth().onAuthStateChanged((user) => {                        
    const statusText = document.getElementById('user-status');                        
    const loginBtn = document.getElementById('btn-login');                        
    if (user) { 
        statusText.innerText = `👤 엔지니어: ${user.displayName || "인증됨"}`; 
        loginBtn.innerText = "로그아웃";
    } else { 
        statusText.innerText = "로그인이 필요합니다."; 
        loginBtn.innerText = "구글 로그인";
    }        
});                

async function askAI() {                        
    const prodName = document.getElementById('prod-name').value.trim();
    const prodSymptom = document.getElementById('prod-symptom').value.trim();
    
    if(!prodName || !prodSymptom) return alert("제품명과 고장 증상을 입력하세요!");                                    
    
    const btn = document.getElementById('btn-generate');
    btn.innerText = "⚡ 제미나이 공학 연산 중...";
    btn.disabled = true;
    
    try {                                
        const response = await fetch(APPS_SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: JSON.stringify({ name: prodName, symptom: prodSymptom }) 
        });                                                                
        
        if (!response.ok) throw new Error(`통신 에러: ${response.status}`);

        const rawText = await response.text();
        
        // 💡 텍스트를 '||' 기호 기준으로 쪼개어 각각 배열에 할당합니다.
        const parts = rawText.split('||');
        
        let result = {
            name: parts[0] ? parts[0].trim() : prodName,
            level: parts[1] ? parts[1].trim() : "주의",
            cause: parts[2] ? parts[2].trim() : "분석 완료",
            analysis: parts[3] ? parts[3].trim() : rawText,
            solution: parts[4] ? parts[4].trim() : "안전에 유의하십시오."
        };

        // UI 바인딩 처리
        document.getElementById('out-name').innerText = result.name;
        
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = result.level;
        if (result.level.includes("위험")) { levelEl.style.color = "#ef4444"; } 
        else if (result.level.includes("주의")) { levelEl.style.color = "#f59e0b"; } 
        else { levelEl.style.color = "#10b981"; }

        document.getElementById('out-cause').innerText = result.cause;
        document.getElementById('out-analysis').innerText = result.analysis;
        document.getElementById('out-solution').innerText = result.solution;
        
        applyProductImage(prodName);
        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = result.analysis + " 이어서 권장 조치사항입니다. " + result.solution;
                                       
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ 터미널 예외 복구</span><br><br>내용: ${error.message}`;                        
    } finally {
        btn.innerText = "AI 제품 원인 분석 시작";
        btn.disabled = false;
    }
}

function applyProductImage(prodName) {
    const imgEl = document.getElementById('out-img');
    const placeholderEl = document.getElementById('img-placeholder');
    const searchKeyword = encodeURIComponent(prodName.trim() + " hardware");
    let targetUrl = `https://images.unsplash.com/featured/400x400/?${searchKeyword}`;

    imgEl.src = targetUrl;
    imgEl.onload = function() {
        placeholderEl.style.display = "none";
        imgEl.style.display = "block";
    };
}

function speakResult() {                        
    if (!currentSolutionText) return;                                                                    
    window.speechSynthesis.cancel();                         
    const utterance = new SpeechSynthesisUtterance(currentSolutionText);                        
    utterance.lang = 'ko-KR';                        
    window.speechSynthesis.speak(utterance);                
}
