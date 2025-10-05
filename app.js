// app.js - single module for index + admin
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js";
import { getStorage, ref as sref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-storage.js";

/* --- FIREBASE CONFIG - VERVANG HIER met jouw config uit Firebase console --- */
const firebaseConfig = {
  apiKey: "AIzaSyD50dqu9YO7Lji3aGmtPOIXFmrSz-ysSO8",
  authDomain: "gamehub-project-86b23.firebaseapp.com",
  projectId: "gamehub-project-86b23",
  storageBucket: "gamehub-project-86b23.firebasestorage.app",
  messagingSenderId: "903764701695",
  appId: "1:903764701695:web:fba8c6279659d3722437ca",
  measurementId: "G-CLH1WM97F4"
};
/* ------------------------------------------------------------------------- */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Helper: admin credentials mapping ---
// De gebruiker wilde: gebruikersnaam admin123 en wachtwoord admin123.
// Firebase gebruikt e-mail; instructie hierboven laat je aanmaken: admin@example.com / admin123
const DEMO_USERNAME = "admin123";
const DEMO_PASSWORD = "admin123";
const DEMO_EMAIL = "admin@example.com"; // maak deze user aan in Firebase Auth console

// --- UI elements (index + admin pages) ---
const grid = document.getElementById('grid');
const search = document.getElementById('search');
const tpl = document.getElementById('card-tpl');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const adminPanel = document.getElementById('admin-panel');
const authBox = document.getElementById('auth-box');

const gTitle = document.getElementById('gTitle');
const gDesc = document.getElementById('gDesc');
const gThumb = document.getElementById('gThumb');
const gFile = document.getElementById('gFile');
const gStore = document.getElementById('gStore');
const btnAdd = document.getElementById('btnAdd');
const statusDiv = document.getElementById('status');

// --- Load and render games from Firestore ---
async function loadGames() {
  if(!grid) return;
  grid.innerHTML = 'Laden…';
  const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const games = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderGames(games);
}

function renderGames(games) {
  if(!grid) return;
  grid.innerHTML = '';
  games.forEach(g => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.thumb').src = g.thumb || 'https://picsum.photos/seed/' + encodeURIComponent(g.title) + '/600/300';
    node.querySelector('.thumb').alt = g.title;
    node.querySelector('.title').textContent = g.title;
    node.querySelector('.desc').textContent = g.desc || '';
    const dl = node.querySelector('.download');
    dl.href = g.fileUrl || '#';
    // ensure forced download by setting download attribute only if same-origin or blob
    dl.setAttribute('download', '');
    const store = node.querySelector('.store');
    if(g.storeUrl) store.href = g.storeUrl;
    else store.style.display = 'none';
    grid.appendChild(node);
  });
}

// Search filter
if(search){
  search.addEventListener('input', async (e) => {
    const q = e.target.value.toLowerCase();
    const col = collection(db, "games");
    const snap = await getDocs(col);
    const games = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const filtered = games.filter(g => ((g.title||'') + ' ' + (g.desc||'') + ' ' + (g.tags||'')).toLowerCase().includes(q));
    renderGames(filtered);
  });
}

// --- Admin login flow ---
if(btnLogin){
  btnLogin.addEventListener('click', async () => {
    const uname = usernameInput.value.trim();
    const pass = passwordInput.value;
    if(uname !== DEMO_USERNAME || pass !== DEMO_PASSWORD){
      alert('Ongeldige demo gebruikersnaam/wachtwoord.');
      return;
    }
    // map demo username -> firebase email
    try {
      await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
      // onAuthStateChanged zal verder handelen
    } catch(err){
      alert('Login faalde: ' + err.message + '\nZorg dat je de Firebase user admin@example.com met wachtwoord admin123 hebt aangemaakt.');
    }
  });
}

if(btnLogout){
  btnLogout.addEventListener('click', async () => {
    await signOut(auth);
  });
}

// React to auth changes to show / hide admin panel
onAuthStateChanged(auth, user => {
  if(user){
    // show admin UI
    if(adminPanel) adminPanel.style.display = '';
    if(authBox) authBox.style.display = 'none';
    if(btnLogout) btnLogout.style.display = '';
    if(statusDiv) statusDiv.textContent = `Ingelogd als ${user.email}`;
  } else {
    if(adminPanel) adminPanel.style.display = 'none';
    if(authBox) authBox.style.display = '';
    if(btnLogout) btnLogout.style.display = 'none';
    if(statusDiv) statusDiv.textContent = '';
  }
});

// --- Upload file + add metadata to Firestore ---
if(btnAdd){
  btnAdd.addEventListener('click', async () => {
    const title = gTitle.value.trim();
    const desc = gDesc.value.trim();
    const thumb = gThumb.value.trim();
    const storeUrl = gStore.value.trim();
    const file = gFile.files[0];
    if(!title) return alert('Vul een titel in');
    if(!file) return alert('Selecteer een bestand om te uploaden');

    statusDiv.textContent = 'Uploaden...';
    try {
      // upload file to Storage under games/<timestamp>_<filename>
      const path = `games/${Date.now()}_${file.name}`;
      const storageRef = sref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snap)=> { /* progress optionally */ },
          (err)=> reject(err),
          ()=> resolve()
        );
      });
      const fileUrl = await getDownloadURL(storageRef);

      // add doc to Firestore
      const docRef = await addDoc(collection(db, "games"), {
        title,
        desc,
        thumb: thumb || '',
        storeUrl: storeUrl || '',
        fileUrl,
        createdAt: serverTimestamp()
      });

      statusDiv.textContent = 'Klaar — game toegevoegd!';
      // clear form
      gTitle.value = ''; gDesc.value=''; gThumb.value=''; gStore.value=''; gFile.value = '';
      // refresh list if on index page
      await loadGames();
    } catch(err){
      console.error(err);
      statusDiv.textContent = 'Fout: ' + err.message;
    }
  });
}

// On page load: if index page, load games
document.addEventListener('DOMContentLoaded', async () => {
  // if index page (grid exists) load games
  if(document.getElementById('grid')){
    try { await loadGames(); } catch(e){ console.error(e); grid.innerHTML = 'Fout bij laden'; }
  }
});
