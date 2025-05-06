import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { collection, setDoc, doc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

export function setupAuth(auth, db) {
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const logoutButton = document.getElementById('logout');

    if (loginButton) {
        loginButton.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'index.html';
            } catch (error) {
                alert('Erreur de connexion : ' + error.message);
            }
        });
    }

    if (registerButton) {
        registerButton.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email,
                    role: 'user',
                    createdAt: serverTimestamp()
                });
                window.location.href = 'index.html';
            } catch (error) {
                alert('Erreur d\'inscription : ' + error.message);
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth);
            window.location.href = 'login.html';
        });
    }

    onAuthStateChanged(auth, user => {
        const loginMenu = document.getElementById('loginMenu');
        const userMenu = document.getElementById('userMenu');
        const organizerMenu = document.getElementById('organizerMenu');
        const adminMenu = document.getElementById('adminMenu');
        const logoutMenu = document.getElementById('logout');

        if (user) {
            loginMenu?.classList.add('d-none');
            logoutMenu?.classList.remove('d-none');
            getDoc(doc(db, 'users', user.uid)).then(doc => {
                const role = doc.data()?.role || 'user';
                organizerMenu?.classList.toggle('d-none', role !== 'organizer' && role !== 'admin');
                adminMenu?.classList.toggle('d-none', role !== 'admin');
                if (window.location.pathname.includes('index.html')) {
                    showSection('userSection');
                }
            });
        } else {
            loginMenu?.classList.remove('d-none');
            logoutMenu?.classList.add('d-none');
            organizerMenu?.classList.add('d-none');
            adminMenu?.classList.add('d-none');
            if (window.location.pathname.includes('index.html')) {
                window.location.href = 'login.html';
            }
        }
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    document.getElementById(sectionId)?.classList.remove('d-none');
}
