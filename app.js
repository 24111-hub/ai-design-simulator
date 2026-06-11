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

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxNDsegsBsGsbtC2HZGtJV640rlAz6p8a6GLVjLJ_icQHOX8CAj7SYvbPOgsy7WdN4/exec";                                

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

// 💡 [핵심] PGB-04 정밀 조준 이미지 저격 로직
function applyProductImage(prodName) {
    const imgEl = document.getElementById('out-img');
    const placeholderEl = document.getElementById('img-placeholder');
    const nameStr = prodName.toLowerCase();
    
    // 기본 회로 기판 이미지
    let targetUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80"; 

    // 사용자가 PGB-04를 입력하면 연보라색 보조배터리 고해상도 고정 매핑
    if (nameStr.includes("pgb") || nameStr.includes("pgb-04")) {
        targetUrl = "https://images.unsplash.com/photo-1701047463132-094155b9ccfc?w=400&auto=format&fit=crop&q=80"; 
    } 
    // 갤럭시 S25 및 일반 스마트폰 기종 처리
    else if (nameStr.includes("갤럭시") || nameStr.includes("s25") || nameStr.includes("폰") || nameStr.includes("iphone")) {
        targetUrl = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80"; 
    } 
    // 노트북 및 PC 기종 처리
    else if (nameStr.includes("맥북") || nameStr.includes("노트북") || nameStr.includes("laptop")) {
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
    
    if(!prodName || !prodSymptom) return alert("제품명과 이상 증상을 모두 입력해 주세요!");                                    
    
    const btn = document.getElementById('btn-generate');
    btn.innerText = "⚡ 하드웨어 결함 메커니즘 정밀 연산 중...";
    btn.disabled = true;
    
    const combinedPrompt = `[대상 장비]: ${prodName}\n[고장 증상]: ${prodSymptom}\n위 장비 정보를 진단하여 규칙에 맞는 JSON 포맷으로 응답하세요.`;
    
    try {                                
        const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ prompt: combinedPrompt }) });                                                                
        const responseText = await response.text();
        let serverData = JSON.parse(responseText);
        
        let targetJSONText = (serverData.choices && serverData.choices[0] && serverData.choices[0].message) ? serverData.choices[0].message.content : responseText;
        targetJSONText = targetJSONText.replace(/```json|```/gi, "").trim();
        
        let aiData = JSON.parse(targetJSONText);
        
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = aiData.danger_level || "---";
        if (levelEl.innerText.includes("위험")) { levelEl.style.color = "#ef4444"; } 
        else if (levelEl.innerText.includes("주의")) { levelEl.style.color = "#f59e0b"; } 
        else { levelEl.style.color = "#10b981"; }

        document.getElementById('out-name').innerText = aiData.product_name || prodName;
        document.getElementById('out-cause').innerText = aiData.main_cause || "---";
        document.getElementById('out-analysis').innerText = aiData.analysis || "분석 데이터를 파싱할 수 없습니다.";
        document.getElementById('out-solution').innerText = aiData.solution || "조치 지침 가이드라인 부재";
        
        // 입력값 기준 이미지 세팅 작동
        applyProductImage(prodName);

        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = (aiData.analysis || "") + " 이어서 엔지니어 권장 가이드라인입니다. " + (aiData.solution || "");
        speakResult();                                
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerText = `⚠️ 시스템 연동 에러가 발생했습니다: ${error.message}`;                        
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
