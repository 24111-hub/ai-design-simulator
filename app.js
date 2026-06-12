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

// 🚨 [필독] 구글에서 '새 배포' 후 나온 최종 /exec 주소를 여기에 꼭 업데이트 하세요!
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzEkQlw7asS0nt6xMySIBPsJKSFn1sUjwqgwjXI4a1lldbgBOIAYWYzXzb9OUm6EXnn/exec";                                

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

// 🎨 제품 이미지 매핑 로직 (PGB-04 입력 시 연보라 배터리 매칭)
function applyProductImage(prodName) {
    const imgEl = document.getElementById('out-img');
    const placeholderEl = document.getElementById('img-placeholder');
    const nameStr = prodName.toLowerCase();
    
    // 기본 스마트 일렉트로닉스 이미지
    let targetUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80"; 

    if (nameStr.includes("pgb") || nameStr.includes("배터리")) {
        // 원하는 연보라색 맥세이프 보조배터리 전용 스톡 이미지 고정
        targetUrl = "https://images.unsplash.com/photo-1701047463132-094155b9ccfc?w=400&auto=format&fit=crop&q=80"; 
    } else if (nameStr.includes("갤럭시") || nameStr.includes("s25") || nameStr.includes("폰")) {
        targetUrl = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80"; 
    } else if (nameStr.includes("맥북") || nameStr.includes("노트북")) {
        targetUrl = "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&auto=format&fit=crop&q=80"; 
    }

    imgEl.src = targetUrl;
    imgEl.onload = function() {
        placeholderEl.style.display = "none";
        imgEl.style.display = "block";
    };
}

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
        // 🔒 [핵심 우회] 구글 서버의 CORS 거부를 완벽히 분쇄하기 위해 text/plain 타입으로 우회 전송
        const response = await fetch(APPS_SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: JSON.stringify({ prompt: combinedPrompt }) 
        });                                                                
        
        if (!response.ok) throw new Error(`HTTP 통신 실패! 상태코드: ${response.status}`);

        const responseText = await response.text();
        let cleanText = responseText.trim();
        
        if (cleanText.startsWith("<!DOCTYPE") || cleanText.includes("Error")) {
          throw new Error("구글 웹앱 권한 승인이 풀렸거나 에러 페이지가 반환되었습니다.");
        }

        // 마크다운 역따옴표 기호 자동 제거 세척기
        cleanText = cleanText.replace(/```json|```/gi, "").trim();
        
        let aiData;
        try {
            aiData = JSON.parse(cleanText);
        } catch (e) {
            // JSON 파싱 실패 시 튕기지 않고 수동 강제 매핑 처리 (폴백)
            aiData = {
                product_name: prodName,
                danger_level: "🟡 주의",
                main_cause: "데이터 포맷 예외 발생",
                analysis: responseText,
                solution: "구글 앱스 스크립트 내부의 OpenAI API 토큰 잔여량 및 차단 상태를 점검하세요."
            };
        }
        
        // 결과 바인딩
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = aiData.danger_level || "주의";
        if (levelEl.innerText.includes("위험")) { levelEl.style.color = "#ef4444"; } 
        else if (levelEl.innerText.includes("주의")) { levelEl.style.color = "#f59e0b"; } 
        else { levelEl.style.color = "#10b981"; }

        document.getElementById('out-name').innerText = aiData.product_name || prodName;
        document.getElementById('out-cause').innerText = aiData.main_cause || "---";
        document.getElementById('out-analysis').innerText = aiData.analysis;
        document.getElementById('out-solution').innerText = aiData.solution;
        
        // 이미지 최적화 함수 호출
        applyProductImage(prodName);

        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = (aiData.analysis || "") + " 이어서 가이드라인입니다. " + (aiData.solution || "");
        speakResult();                                
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ [치명적인 연동 결함 발생]</span><br><br>에러 메세지: ${error.message}<br><br>[해결 가이드]<br>1. Google Apps Script 배포 시 Access 권한을 반드시 'Anyone'으로 설정했는지 확인하세요.<br>2. GAS 코드 내부의 OpenAI API 키가 올바른지 다시 점검하세요.`;                        
    } finally {
        btn.innerText = "AI 제품 원인 분석 시작";
        btn.disabled = false;
    }
}                

function speakResult() {                        
    if (!currentSolutionText) return;                                    
    window.speechSynthesis.cancel();                         
    const utterance = new SpeechSynthesisUtterance(currentSolutionText);                        
    utterance.lang = 'ko-KR';                        
    window.speechSynthesis.speak(utterance);                
}
