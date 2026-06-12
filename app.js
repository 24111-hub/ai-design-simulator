// 1. Firebase 환경 설정 정보
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

// 2. 구글 앱스 스크립트 웹앱 배포 URL (이전 가이드대로 새 배포된 최신 주소여야 합니다!)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwpvmVKVPLpu-BZxlGMW814MVNDpBrD_O9rUs-zMJxaSJ513t8ZDYTvMwHtlpbATcma/exec";                                

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

// 3. AI 연동 및 데이터 바인딩 최종 수정 함수
async function askAI() {                        
    const prodName = document.getElementById('prod-name').value.trim();
    const prodSymptom = document.getElementById('prod-symptom').value.trim();
    
    if(!prodName || !prodSymptom) return alert("제품명과 고장 증상을 입력하세요!");                                    
    
    const btn = document.getElementById('btn-generate');
    btn.innerText = "⚡ 하드웨어 결함 연산 중...";
    btn.disabled = true;
    
    const combinedPrompt = `${prodName} 제품의 고장 증상(${prodSymptom})을 분석하세요. 반드시 다른 설명 없이 아래 형식의 JSON 데이터만 응답하세요.
    {
      "product_name": "${prodName}",
      "danger_level": "위험, 주의, 안전 중 하나",
      "main_cause": "한 줄 요약 원인",
      "analysis": "상세 결함 메커니즘 공학적 분석 내용",
      "solution": "안전 가이드라인 및 조치 방법"
    }`;
    
    try {                                
        // CSP 정책 우회를 위해 mode: 'cors' 및 헤더 구성 강화
        const response = await fetch(APPS_SCRIPT_URL, { 
            method: 'POST', 
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: JSON.stringify({ prompt: combinedPrompt }) 
        });                                                                
        
        if (!response.ok) throw new Error(`HTTP 통신 실패! 상태코드: ${response.status}`);

        const responseText = await response.text();
        let cleanText = responseText.trim();

        // 🚨 혹시 OpenAI가 마크다운 코드 블록을 섞어 보냈을 경우 완벽 정제
        if (cleanText.includes("```")) {
            cleanText = cleanText.replace(/```json|```/gi, "").trim();
        }
        
        let aiData;
        try {
            aiData = JSON.parse(cleanText);
        } catch (e) {
            // 구조가 깨진 원본 문자열이 넘어왔을 때 가공 처리하는 안전 보충 장치
            aiData = {
                product_name: prodName,
                danger_level: "🟡 주의",
                main_cause: "하드웨어 장치 응답 수신 성공",
                analysis: cleanText, 
                solution: "기기의 전원을 차단하고 상세 정밀 조치 가이드를 확보하십시오."
            };
        }
        
        // 인터페이스 요소 바인딩
        document.getElementById('out-name').innerText = aiData.product_name || prodName;
        
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = aiData.danger_level || "주의";
        if (levelEl.innerText.includes("위험")) { levelEl.style.color = "#ef4444"; } 
        else if (levelEl.innerText.includes("주의")) { levelEl.style.color = "#f59e0b"; } 
        else { levelEl.style.color = "#10b981"; }

        document.getElementById('out-cause').innerText = aiData.main_cause || "과부하 계통 점검 필요";
        document.getElementById('out-analysis').innerText = aiData.analysis || cleanText;
        document.getElementById('out-solution').innerText = aiData.solution || "가이드라인을 참조하세요.";
        
        applyProductImage(prodName);

        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = (aiData.analysis || cleanText) + " 이어서 조치 가이드라인입니다. " + (aiData.solution || "");
                                       
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ [데이터 전송 레이어 결함]</span><br><br>현상: 외부 보안 정책 또는 네트워크 지연으로 인한 통신 끊김.<br>원인: ${error.message}`;                        
    } finally {
        btn.innerText = "AI 제품 원인 분석 시작";
        btn.disabled = false;
    }
}

// 4. 제품 이미지 동적 매핑 로직 (보안 정책 반영 백업 이미지 강화)
function applyProductImage(prodName) {
    const imgEl = document.getElementById('out-img');
    const placeholderEl = document.getElementById('img-placeholder');
    
    const searchKeyword = encodeURIComponent(prodName.trim() + " tech");
    let targetUrl = "[https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80](https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80)"; 

    if (prodName.trim()) {
        targetUrl = `https://images.unsplash.com/featured/400x400/?${searchKeyword}`;
    }

    imgEl.src = targetUrl;
    imgEl.onload = function() {
        placeholderEl.style.display = "none";
        imgEl.style.display = "block";
    };
    imgEl.onerror = function() {
        imgEl.src = "https://script.google.com/macros/s/AKfycbyrJ8h5yCEhAKSLE7RFsF2kNnGRl_QxtHKqR-WZ8WBLXGNX7oO0Zr7gwygoCP283fRA/exec";
    };
}

// 5. 음성 브리핑 로직
function speakResult() {                        
    if (!currentSolutionText) return;                                                                    
    window.speechSynthesis.cancel();                         
    const utterance = new SpeechSynthesisUtterance(currentSolutionText);                        
    utterance.lang = 'ko-KR';                        
    window.speechSynthesis.speak(utterance);                
}
