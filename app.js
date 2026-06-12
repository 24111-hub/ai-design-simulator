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

// 🚨 구글 앱스 스크립트 주소 (그대로 유지)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-vZlady7nZ0oZrtddQQT2ReZw_gUIc3XVsIR6uZBCGDPOQ2nMksZvJXmobDSjdOc/exec";                                

let currentSolutionText = ""; 
const provider = new firebase.auth.GoogleAuthProvider();                                

function toggleLogin() {                        
    const user = firebase.auth().currentUser;                        
    if (!user) { 
        firebase.auth().signInWithPopup(provider).catch(e => console.error(e)); 
    } else { 
        firebase.auth().signOut(); 
    }
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
    btn.innerText = "⚡ 하드웨어 결함 연산 중...";
    btn.disabled = true;
    
    try {                                
        // 데이터 전송 레이어를 깔끔하게 구조화하여 송신
        const response = await fetch(APPS_SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: JSON.stringify({
                name: prodName,
                symptom: prodSymptom
            }) 
        });                                                                
        
        if (!response.ok) throw new Error(`HTTP 에러: ${response.status}`);

        const responseText = await response.text();
        let cleanText = responseText.trim();

        // 마크다운 태그 청소
        cleanText = cleanText.replace(/```json|```/gi, "").trim();
        
        let aiData;
        try {
            aiData = JSON.parse(cleanText);
        } catch (e) {
            aiData = {
                product_name: prodName,
                danger_level: "주의",
                main_cause: "분석 데이터 매핑 완료",
                analysis: cleanText, 
                solution: "장치의 전원을 안전하게 차단하십시오."
            };
        }
        
        document.getElementById('out-name').innerText = aiData.product_name || prodName;
        
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = aiData.danger_level || "주의";
        if (levelEl.innerText.includes("위험")) { levelEl.style.color = "#ef4444"; } 
        else if (levelEl.innerText.includes("주의")) { levelEl.style.color = "#f59e0b"; } 
        else { levelEl.style.color = "#10b981"; }

        document.getElementById('out-cause').innerText = aiData.main_cause || "회로 스트레스 누적 의심";
        document.getElementById('out-analysis').innerText = aiData.analysis || cleanText;
        document.getElementById('out-solution').innerText = aiData.solution || "안전 가이드라인을 참조하세요.";
        
        applyProductImage(prodName);

        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = (aiData.analysis || cleanText) + " 이어서 조치 가이드입니다. " + (aiData.solution || "");
                                       
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ [통신 처리 오류]</span><br><br>메시지: ${error.message}`;                        
    } finally {
        btn.innerText = "AI 제품 원인 분석 시작";
        btn.disabled = false;
    }
}

function applyProductImage(prodName) {
    const imgEl = document.getElementById('out-img');
    const placeholderEl = document.getElementById('img-placeholder');
    const searchKeyword = encodeURIComponent(prodName.trim() + " device");
    
    let targetUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80"; 

    if (prodName.trim()) {
        targetUrl = `https://images.unsplash.com/featured/400x400/?${searchKeyword}`;
    }

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
