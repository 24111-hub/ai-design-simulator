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
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzBIM9C4dfhpvKUS8WpgDRjkVa4lTyW3p2ADUqiV0z0B7oY0CjhgyjroyKSZhrBPqr3/exec";                                

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

// 3. 🚨 [완벽 리팩토링] 문자열 깨짐 방어선 구축 버전 askAI
async function askAI() {                        
    const prodName = document.getElementById('prod-name').value.trim();
    const prodSymptom = document.getElementById('prod-symptom').value.trim();
    
    if(!prodName || !prodSymptom) return alert("제품명과 고장 증상을 입력하세요!");                                    
    
    const btn = document.getElementById('btn-generate');
    btn.innerText = "⚡ 하드웨어 결함 연산 중...";
    btn.disabled = true;
    
    // AI에게 명확한 JSON 구조 압박
    const combinedPrompt = `Analyze the hardware fault. Product: ${prodName}, Symptom: ${prodSymptom}. 
    You must output ONLY a valid JSON object without markdown fences, matching exactly this structure:
    {"product_name": "${prodName}", "danger_level": "위험/주의/안전 중 하나", "main_cause": "원인 요약", "analysis": "공학적 분석", "solution": "조치 가이드"}`;
    
    try {                                
        const response = await fetch(APPS_SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: JSON.stringify({ prompt: combinedPrompt }) 
        });                                                                
        
        if (!response.ok) throw new Error(`HTTP 에러! 상태코드: ${response.status}`);

        let responseText = await response.text();
        responseText = responseText.trim();

        // 🔥 [방어선 1] 구글/OpenAI 특유의 문자열 역슬래시 및 줄바꿈 기호 정밀 청소
        if (responseText.startsWith('"') && responseText.endsWith('"')) {
            responseText = responseText.substring(1, responseText.length - 1);
        }
        // 마크다운 블록 찌꺼기 제거
        let cleanText = responseText.replace(/```json|```/gi, "").trim();
        // 이스케이프 문자 정상화
        cleanText = cleanText.replace(/\\n/g, " ").replace(/\\"/g, '"');

        let aiData;
        try {
            aiData = JSON.parse(cleanText);
        } catch (e) {
            // 파싱 실패 시 텍스트를 분석란에 강제로 매핑해주는 2차 방어선
            aiData = {
                product_name: prodName,
                danger_level: "주의",
                main_cause: "원시 데이터 스트림 파싱",
                analysis: cleanText, 
                solution: "기기를 분리하고 내부 회로 소손 여부를 점검하십시오."
            };
        }
        
        // 4. 안전하게 정제된 데이터 대시보드 바인딩
        document.getElementById('out-name').innerText = aiData.product_name || prodName;
        
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = aiData.danger_level || "주의";
        if (levelEl.innerText.includes("위험")) { levelEl.style.color = "#ef4444"; } 
        else if (levelEl.innerText.includes("주의")) { levelEl.style.color = "#f59e0b"; } 
        else { levelEl.style.color = "#10b981"; }

        document.getElementById('out-cause').innerText = aiData.main_cause || "내부 소자 결함 의심";
        document.getElementById('out-analysis').innerText = aiData.analysis || cleanText;
        document.getElementById('out-solution').innerText = aiData.solution || "안전 가이드라인을 참조하세요.";
        
        applyProductImage(prodName);

        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = (aiData.analysis || cleanText) + " 이어서 조치 가이드라인입니다. " + (aiData.solution || "");
                                       
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ [시스템 인터페이스 연동 결함]</span><br><br>현상: ${error.message}`;                        
    } finally {
        btn.innerText = "AI 제품 원인 분석 시작";
        btn.disabled = false;
    }
}

// 5. Unsplash 기반 제품 맞춤형 이미지 동적 로더
function applyProductImage(prodName) {
    const imgEl = document.getElementById('out-img');
    const placeholderEl = document.getElementById('img-placeholder');
    const searchKeyword = encodeURIComponent(prodName.trim() + " hardware device");
    
    let targetUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80"; 

    if (prodName.trim()) {
        targetUrl = `https://images.unsplash.com/featured/400x400/?${searchKeyword}`;
    }

    imgEl.src = targetUrl;
    imgEl.onload = function() {
        placeholderEl.style.display = "none";
        imgEl.style.display = "block";
    };
    imgEl.onerror = function() {
        imgEl.src = "https://script.google.com/macros/s/AKfycbxWV7FctdUjWecu7bQvqsrOL7tmpIFsYQndQPJqsgMb3rFghKmFm2TU9P-hlNeSshxw/exec";
    };
}

// 6. 음성 시스템 가동
function speakResult() {                        
    if (!currentSolutionText) return;                                                                    
    window.speechSynthesis.cancel();                         
    const utterance = new SpeechSynthesisUtterance(currentSolutionText);                        
    utterance.lang = 'ko-KR';                        
    window.speechSynthesis.speak(utterance);                
}
