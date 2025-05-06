import { collection, getDocs, getDoc, updateDoc, doc, query, where } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

export async function loadOrganizerReservations() {
    const db = window.db;
    const auth = window.auth;
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const role = userDoc.data()?.role;
    if (role !== 'organizer' && role !== 'admin') return;

    const reservationList = document.getElementById('reservationList');
    if (!reservationList) return;
    reservationList.innerHTML = '<h3>Réservations</h3>';

    const reservations = await getDocs(collection(db, 'reservations'));
    reservations.forEach(async resDoc => {
        const res = resDoc.data();
        const event = (await getDoc(doc(db, 'events', res.eventId))).data();
        reservationList.innerHTML += `
            <div class="alert alert-info">
                Événement: ${event.name}<br>
                Utilisateur: ${res.userId}<br>
                Catégorie: ${res.category}<br>
                Statut: ${res.status}<br>
                <button class="btn btn-sm btn-success" onclick="validateReservation('${resDoc.id}')">Valider</button>
            </div>`;
    });

    document.getElementById('validateTicket')?.addEventListener('click', async () => {
        const qrInput = document.getElementById('qrInput').value;
        const [userId, eventId, category] = qrInput.split('-');
        const q = query(
            collection(db, 'reservations'),
            where('userId', '==', userId),
            where('eventId', '==', eventId),
            where('category', '==', category)
        );
        const resDocs = await getDocs(q);
        if (!resDocs.empty) {
            await updateDoc(doc(db, 'reservations', resDocs.docs[0].id), { status: 'validée' });
            alert('Billet validé !');
            loadOrganizerReservations();
        } else {
            alert('Billet invalide.');
        }
    });
}

window.validateReservation = async function(reservationId) {
    const db = window.db;
    await updateDoc(doc(db, 'reservations', reservationId), { status: 'validée' });
    alert('Réservation validée !');
    loadOrganizerReservations();
};

document.getElementById('organizerMenu')?.addEventListener('click', () => {
    showSection('organizerSection');
    loadOrganizerReservations();
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    document.getElementById(sectionId)?.classList.remove('d-none');
}