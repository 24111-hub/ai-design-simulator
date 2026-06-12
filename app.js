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

// 🚨 구글 스크립트 '새 버전 배포' 후 주소를 여기에 정확하게 붙여넣으세요!
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxuDT_BLusO2A9tuQfTMDDY-Aof1bvbBg19heQfI6N9-D3Il8CniBDR1_3-7PaEvQSl/exec";                                

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

        const rawText = await response.text();
        
        // 원시 텍스트 줄바꿈 분석 매핑 파서 기동
        let lines = rawText.split('\n');
        let data = { name: prodName, level: "주의", cause: "원인 분석 완료", analysis: rawText, solution: "안전에 유의하세요." };

        lines.forEach(line => {
            if(line.startsWith("진단제품:")) data.name = line.replace("진단제품:", "").trim();
            if(line.startsWith("위험등급:")) data.level = line.replace("위험등급:", "").trim();
            if(line.startsWith("추정원인:")) data.cause = line.replace("추정원인:", "").trim();
            if(line.startsWith("공학분석:")) data.analysis = line.replace("공학분석:", "").trim();
            if(line.startsWith("권장조치:")) data.solution = line.replace("권장조치:", "").trim();
        });

        // 대시보드 인터페이스 최종 렌더링
        document.getElementById('out-name').innerText = data.name;
        
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = data.level;
        if (data.level.includes("위험")) { levelEl.style.color = "#ef4444"; } 
        else if (data.level.includes("주의")) { levelEl.style.color = "#f59e0b"; } 
        else { levelEl.style.color = "#10b981"; }

        document.getElementById('out-cause').innerText = data.cause;
        document.getElementById('out-analysis').innerText = data.analysis.length > 5 ? data.analysis : rawText;
        document.getElementById('out-solution').innerText = data.solution;
        
        applyProductImage(prodName);
        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = document.getElementById('out-analysis').innerText + " 이어서 안전 조치 가이드입니다. " + data.solution;
                                       
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ 터미널 예외 복구 완료</span><br><br>내용: ${error.message}`;                        
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
