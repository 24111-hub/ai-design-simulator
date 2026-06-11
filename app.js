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

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx7183YRKzSvkZm4xMAMWAZpIuaOC1HRPYgOabuIUcLO3LEjLIJx2h3YjOHst5QAm60/exec";                                

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

// 💡 PGB-04 연보라 보조배터리 조준 사격 매핑 로직
function applyProductImage(prodName) {
    const imgEl = document.getElementById('out-img');
    const placeholderEl = document.getElementById('img-placeholder');
    const nameStr = prodName.toLowerCase();
    
    // 기본 회로 이미지 주소
    let targetUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80"; 

    if (nameStr.includes("pgb") || nameStr.includes("배터리")) {
        // 연보라색 맥세이프 보조배터리 형태의 테크 스톡 이미지로 고정
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
    
    // AI가 JSON 규격을 무조건 지키도록 프롬프트 가드레일 추가 조치
    const combinedPrompt = `${prodName} 제품의 고장 증상(${prodSymptom})을 분석하세요. 반드시 다른 설명 없이 오직 아래 형식의 순수한 JSON 데이터만 응답해야 합니다. 기호 \`\`\`json 같은 마크다운 코드블록도 절대 쓰지 마세요.
    {
      "product_name": "${prodName}",
      "danger_level": "위험, 주의, 안전 중 하나",
      "main_cause": "한 줄 요약 원인",
      "analysis": "상세 결함 메커니즘 공학적 분석 내용",
      "solution": "안전 가이드라인 및 조치 방법"
    }`;
    
    try {                                
        const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ prompt: combinedPrompt }) });                                                                
        const responseText = await response.text();
        console.log("서버 원본 응답:", responseText); // 디버깅용 로그 유지

        let cleanText = responseText.trim();
        
        // 1차 방어선: 혹시 모를 구글 스크립트 에러 응답 분기 처리
        if (cleanText.startsWith("<!DOCTYPE") || cleanText.includes("Error")) {
            throw new Error("Google Apps Script 배포 에러 또는 스크립트 실행 권한 거부 상태입니다. 웹앱 주소 및 'Anyone' 설정 여부를 확인하세요.");
        }

        // 2차 방어선: 마크다운 역따옴표 기호 강제 세척
        cleanText = cleanText.replace(/```json|```/gi, "").trim();
        
        let aiData;
        try {
            aiData = JSON.parse(cleanText);
        } catch (parseError) {
            // 3차 방어선: JSON 파싱 실패 시, 화면 폭발을 막고 원본 텍스트라도 가독성 있게 화면에 강제 바인딩
            console.warn("JSON 파싱 실패, 텍스트 폴백 모드로 전환합니다.");
            aiData = {
                product_name: prodName,
                danger_level: "주의 (데이터 포맷 오류)",
                main_cause: "AI가 규격화된 데이터 포맷을 반환하지 않았습니다.",
                analysis: "📢 [서버 리턴 원본 데이터]\n\n" + responseText,
                solution: "엔지니어링 콘솔 로그 또는 Google Apps Script 소스코드 내 OpenAI API Key의 만료 여부 및 잔여 토큰량을 체크하십시오."
            };
        }
        
        // 데이터 대시보드 렌더링 시작
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = aiData.danger_level || "---";
        if (levelEl.innerText.includes("위험")) { levelEl.style.color = "#ef4444"; } 
        else if (levelEl.innerText.includes("주의")) { levelEl.style.color = "#f59e0b"; } 
        else { levelEl.style.color = "#10b981"; }

        document.getElementById('out-name').innerText = aiData.product_name || prodName;
        document.getElementById('out-cause').innerText = aiData.main_cause || "---";
        document.getElementById('out-analysis').innerText = aiData.analysis;
        document.getElementById('out-solution').innerText = aiData.solution;
        
        // 이미지 최적화 호출
        applyProductImage(prodName);

        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = (aiData.analysis || "") + " 이어서 가이드라인입니다. " + (aiData.solution || "");
        speakResult();                                
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerText = `⚠️ [치명적인 연동 결함 발생]\n\n에러 메세지: ${error.message}\n\n[해결 가이드]\n1. Google Apps Script를 새로 배포(New deployment)하시고 Access 권한을 반드시 'Anyone'으로 설정했는지 확인하세요.\n2. GAS 코드 내부의 OpenAI API 키가 올바른지 다시 점검하세요.`;                        
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
