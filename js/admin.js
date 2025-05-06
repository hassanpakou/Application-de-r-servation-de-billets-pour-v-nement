import { collection, getDocs, getDoc, updateDoc, doc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

export async function loadUserManagement() {
    const db = window.db;
    const auth = window.auth;
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const role = userDoc.data()?.role;
    if (role !== 'admin') return;

    const userManagement = document.getElementById('userManagement');
    if (!userManagement) return;
    userManagement.innerHTML = '<h3>Gestion des Utilisateurs</h3>';

    const users = await getDocs(collection(db, 'users'));
    users.forEach(userDoc => {
        const userData = userDoc.data();
        userManagement.innerHTML += `
            <div class="alert alert-info">
                Email: ${userData.email}<br>
                Rôle: ${userData.role}<br>
                <select id="role_${userDoc.id}" class="form-select mb-2">
                    <option value="user" ${userData.role === 'user' ? 'selected' : ''}>Utilisateur</option>
                    <option value="organizer" ${userData.role === 'organizer' ? 'selected' : ''}>Organisateur</option>
                    <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>Administrateur</option>
                </select>
                <button class="btn btn-sm btn-primary" onclick="updateUserRole('${userDoc.id}')">Mettre à jour</button>
            </div>`;
    });

    document.getElementById('createEvent')?.addEventListener('click', async () => {
        const name = document.getElementById('eventName').value;
        const date = document.getElementById('eventDate').value;
        const seats = parseInt(document.getElementById('eventSeats').value);
        const price = parseFloat(document.getElementById('eventPrice').value);
        const vipPrice = parseFloat(document.getElementById('eventVipPrice').value);

        if (!name || !date || !seats || !price || !vipPrice) {
            alert('Veuillez remplir tous les champs.');
            return;
        }

        await addDoc(collection(db, 'events'), {
            name,
            date,
            seats,
            price,
            vipPrice,
            createdAt: serverTimestamp()
        });
        alert('Événement créé !');
        document.getElementById('eventName').value = '';
        document.getElementById('eventDate').value = '';
        document.getElementById('eventSeats').value = '';
        document.getElementById('eventPrice').value = '';
        document.getElementById('eventVipPrice').value = '';
    });
}

window.updateUserRole = async function(userId) {
    const db = window.db;
    const newRole = document.getElementById(`role_${userId}`).value;
    await updateDoc(doc(db, 'users', userId), { role: newRole });
    alert('Rôle mis à jour !');
    loadUserManagement();
};

document.getElementById('adminMenu')?.addEventListener('click', () => {
    showSection('adminSection');
    loadUserManagement();
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    document.getElementById(sectionId)?.classList.remove('d-none');
}
