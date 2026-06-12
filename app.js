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

// 2. 구글 앱스 스크립트 웹앱 배포 URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwpvmVKVPLpu-BZxlGMW814MVNDpBrD_O9rUs-zMJxaSJ513t8ZDYTvMwHtlpbATcma/exec";                                

let currentSolutionText = ""; 
const provider = new firebase.auth.GoogleAuthProvider();                                

// 3. 구글 로그인/로그아웃 토글 제어 함수
function toggleLogin() {                        
    const user = firebase.auth().currentUser;                        
    if (!user) { 
        firebase.auth().signInWithPopup(provider).catch(e => console.error(e)); 
    } else { 
        firebase.auth().signOut(); 
    }
}                

// 4. Firebase 인증 상태 변화 감지 리스너
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

// 5. AI 연동 및 실시간 대시보드 데이터 바인딩 함수
async function askAI() {                        
    const prodName = document.getElementById('prod-name').value.trim();
    const prodSymptom = document.getElementById('prod-symptom').value.trim();
    
    if(!prodName || !prodSymptom) return alert("제품명과 고장 증상을 입력하세요!");                                    
    
    const btn = document.getElementById('btn-generate');
    btn.innerText = "⚡ 하드웨어 결함 연산 중...";
    btn.disabled = true;
    
    const combinedPrompt = `${prodName} 제품의 고장 증상(${prodSymptom})을 분석하세요. 반드시 다른 부연 설명 없이 오직 아래 형식의 순수한 JSON 데이터만 응답해야 합니다.
    {
      "product_name": "${prodName}",
      "danger_level": "위험, 주의, 안전 중 하나",
      "main_cause": "한 줄 요약 원인",
      "analysis": "상세 결함 메커니즘 공학적 분석 내용",
      "solution": "안전 가이드라인 및 조치 방법"
    }`;
    
    try {                                
        const response = await fetch(APPS_SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: JSON.stringify({ prompt: combinedPrompt }) 
        });                                                                
        
        if (!response.ok) throw new Error(`HTTP 통신 실패! 상태코드: ${response.status}`);

        const responseText = await response.text();
        let cleanText = responseText.trim();

        // OpenAI 가공 마크다운 태그 청소
        cleanText = cleanText.replace(/```json|```/gi, "").trim();
        
        let aiData;
        try {
            aiData = JSON.parse(cleanText);
        } catch (e) {
            aiData = {
                product_name: prodName,
                danger_level: "🟡 주의",
                main_cause: "하드웨어 응답 해석 처리",
                analysis: cleanText, 
                solution: "기기를 즉시 분리하고 정밀 점검을 진행하십시오."
            };
        }
        
        // UI 요소 데이터 안전 매핑 (undefined 현상 방지)
        document.getElementById('out-name').innerText = aiData.product_name || prodName;
        
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = aiData.danger_level || "주의";
        if (levelEl.innerText.includes("위험")) { levelEl.style.color = "#ef4444"; } 
        else if (levelEl.innerText.includes("주의")) { levelEl.style.color = "#f59e0b"; } 
        else { levelEl.style.color = "#10b981"; }

        document.getElementById('out-cause').innerText = aiData.main_cause || "하드웨어 계통 과부하 의심";
        document.getElementById('out-analysis').innerText = aiData.analysis || cleanText;
        document.getElementById('out-solution').innerText = aiData.solution || "원인 분석 조치 가이드라인을 참조하세요.";
        
        // ✨ 동적 키워드 이미지 검색 함수 호출
        applyProductImage(prodName);

        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = (aiData.analysis || cleanText) + " 이어서 조치 가이드라인입니다. " + (aiData.solution || "");
                                       
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ [데이터 처리 결함 발생]</span><br><br>에러: ${error.message}`;                        
    } finally {
        btn.innerText = "AI 제품 원인 분석 시작";
        btn.disabled = false;
    }
}

// 6. ✨ [개선] Unsplash 소스를 이용한 제품 맞춤형 동적 이미지 매핑 함수
function applyProductImage(prodName) {
    const imgEl = document.getElementById('out-img');
    const placeholderEl = document.getElementById('img-placeholder');
    
    // 유저가 입력한 제품명을 안전하게 인코딩하고, 전자기기 관련 이미지가 매칭되도록 가이드 키워드 추가
    const searchKeyword = encodeURIComponent(prodName.trim() + " tech electronics device");
    
    // 기본 대기용 이미지 (검색 실패 시 백업용)
    let targetUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80"; 

    if (prodName.trim()) {
        // Unsplash API 키 없이 실시간으로 키워드 무작위 매칭 사진을 가져오는 고화질 소스 URL 활용
        targetUrl = `https://images.unsplash.com/featured/400x400/?${searchKeyword}`;
    }

    // 브라우저가 이미지 로드를 완료하면 플레이스홀더를 숨기고 사진을 보여줌
    imgEl.src = targetUrl;
    imgEl.onload = function() {
        placeholderEl.style.display = "none";
        imgEl.style.display = "block";
    };
    
    // 이미지 로드 실패 시 기본 칩셋 이미지로 롤백 안전장치
    imgEl.onerror = function() {
        imgEl.src = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80";
    };
}

// 7. 엔지니어 리포트 TTS 음성 안내 함수
function speakResult() {                        
    if (!currentSolutionText) return;                                                                    
    window.speechSynthesis.cancel();                         
    const utterance = new SpeechSynthesisUtterance(currentSolutionText);                        
    utterance.lang = 'ko-KR';                        
    window.speechSynthesis.speak(utterance);                
}
