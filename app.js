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
https://script.google.com/macros/s/AKfycbwpvmVKVPLpu-BZxlGMW814MVNDpBrD_O9rUs-zMJxaSJ513t8ZDYTvMwHtlpbATcma/exec
function speakResult() {                        
    if (!currentSolutionText) return;                                    
    window.speechSynthesis.cancel();                         
    const utterance = new SpeechSynthesisUtterance(currentSolutionText);                        
    utterance.lang = 'ko-KR';                        
    window.speechSynthesis.speak(utterance);                
}
