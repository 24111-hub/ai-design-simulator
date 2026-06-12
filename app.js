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

// 🚨 구글 앱스 스크립트 [새 버전 배포] 후 새로 발급받은 /exec 주소를 여기에 교체하세요!
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwszAxo3va7a6jIPkFnltiAx6wwk0LgePO13TZCIYbQ-oNM53zdSZmgjDC8__0y2cYN/exec";                                

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
    btn.innerText = "⚡ 구글 게이트웨이 연산 및 수신 중...";
    btn.disabled = true;
    
    try {                                
        const response = await fetch(APPS_SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: JSON.stringify({ name: prodName, symptom: prodSymptom }) 
        });                                                                
        
        if (!response.ok) throw new Error(`서버 통신 실패 (코드: ${response.status})`);

        const rawText = await response.text();
        
        // UI 대시보드 텍스트 바인딩
        document.getElementById('out-name').innerText = prodName;
        
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = "진단 완료";
        levelEl.style.color = "#10b981"; 

        document.getElementById('out-cause').innerText = "하단 정밀 정비 리포트 참조";
        
        // 메인 리포트 칸에 ChatGPT가 전송한 서술문 통째로 삽입
        document.getElementById('out-analysis').innerText = rawText;
        document.getElementById('out-solution').innerText = "정밀 진단이 완료되었습니다. 위 리포트의 안전 가이드라인을 준수하십시오.";
        
        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = rawText;
                                       
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ 데이터 게이트웨이 차단 발생</span><br><br>내용: ${error.message}`;                        
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
