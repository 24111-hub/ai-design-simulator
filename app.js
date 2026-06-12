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

// 🚨 구글 새 버전 배포 후 주소를 여기에 업데이트해 주세요!
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVidw8By6FDRtlbQ4HXyzKDN4Sdcey3-MpIPrLEptl-lEZilxAKLjaUH1c62mttJwA/exec";                                

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
        
        if (!response.ok) throw new Error(`HTTP 통신 실패: ${response.status}`);

        const responseText = await response.text();
        
        // 받아온 데이터를 정식 JSON으로 깨끗하게 변환합니다.
        const aiData = JSON.parse(responseText.trim());

        // 대시보드 UI 바인딩
        document.getElementById('out-name').innerText = aiData.product_name || prodName;
        
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = aiData.danger_level || "주의";
        if (levelEl.innerText.includes("위험")) { levelEl.style.color = "#ef4444"; } 
        else if (levelEl.innerText.includes("주의")) { levelEl.style.color = "#f59e0b"; } 
        else { levelEl.style.color = "#10b981"; }

        document.getElementById('out-cause').innerText = aiData.main_cause || "분석 완료";
        document.getElementById('out-analysis').innerText = aiData.analysis || responseText;
        document.getElementById('out-solution').innerText = aiData.solution || "안전에 주의하십시오.";
        
        applyProductImage(prodName);
        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = (aiData.analysis || responseText) + " 이어서 정비 가이드 조치사항입니다. " + (aiData.solution || "");
                                       
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ 실시간 데이터 수신 지연</span><br><br>구글 스크립트 수정본이 아직 웹상에 반영되지 않았거나 캐시가 남아있을 수 있습니다. 잠시 후 버튼을 다시 한 번 눌러보세요.`;                        
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
