const firebaseConfig = {            
    apiKey: "AIzaSyDzkv4MyzI1RF9KRPyerJywEtLv427T6DE",            
    authDomain: "project- project-6180622403440470920.firebaseapp.com",            
    databaseURL: "https://project-6180622403440470920-default-rtdb.firebaseio.com",            
    projectId: "project-6180622403440470920",            
    storageBucket: "project-6180622403440470920.firebasestorage.app",            
    messagingSenderId: "626753939152",            
    appId: "1:626753939152:web:485e286ff8e5b596bf20d5",            
    measurementId: "G-QMSFMGJG0J"        
};                
firebase.initializeApp(firebaseConfig);                                

// 🚨 구글 [새 버전 배포]를 진행한 뒤 새로 취득한 exec 웹 앱 주소를 꼭 여기에 붙여넣으세요!
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmgR_ALiEFidmbXDIadM0S2BukQ8QgfT1iAkS9PgSzROuvBbFovpufGZVhSKZFFCD9/exec";                                

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
    btn.innerText = "⚡ 연산 및 데이터 수신 중...";
    btn.disabled = true;
    
    try {                                
        const response = await fetch(APPS_SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: JSON.stringify({ name: prodName, symptom: prodSymptom }) 
        });                                                                
        
        if (!response.ok) throw new Error(`네트워크 응답 규격 이상 (코드: ${response.status})`);

        const rawText = await response.text();
        
        // 데이터 인터페이스 매핑 및 화면 출력
        document.getElementById('out-name').innerText = prodName;
        
        const levelEl = document.getElementById('out-level');
        levelEl.innerText = "주의 / 진단완료";
        levelEl.style.color = "#f59e0b"; 

        document.getElementById('out-cause').innerText = "하단 정밀 정비 분석 리포트 참조";
        
        // 메인 리포트 공간에 데이터 삽입
        document.getElementById('out-analysis').innerText = rawText;
        document.getElementById('out-solution').innerText = "정밀 진단서가 생성되었습니다. 지침에 따라 안전 정비를 수행하십시오.";
        
        document.getElementById('btn-tts').disabled = false;
        currentSolutionText = rawText;
                                       
    } catch (error) {                                
        console.error(error);                                
        document.getElementById('out-analysis').innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ 시스템 통신 예외 발생</span><br><br>내용: ${error.message}`;                        
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
