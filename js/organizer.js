import { collection, getDocs, getDoc, updateDoc, doc, query, where } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

export async function loadOrganizerReservations() {
    try {
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
                    ${res.status !== 'validée' ? `<button class="btn btn-sm btn-success" onclick="validateReservation('${resDoc.id}')">Valider</button>` : ''}
                </div>`;
        });

        document.getElementById('validateTicket')?.addEventListener('click', async () => {
            const qrInput = document.getElementById('qrInput').value;
            if (!qrInput) {
                alert('Veuillez saisir un code QR.');
                return;
            }
            const [userId, eventId, category, reservationId] = qrInput.split('-');
            if (!userId || !eventId || !category || !reservationId) {
                alert('Code QR invalide.');
                return;
            }

            const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
            if (!reservationDoc.exists() || 
                reservationDoc.data().userId !== userId || 
                reservationDoc.data().eventId !== eventId || 
                reservationDoc.data().category !== category ||
                reservationDoc.data().status !== 'confirmée') {
                alert('Billet invalide ou déjà validé.');
                return;
            }

            await updateDoc(doc(db, 'reservations', reservationId), { status: 'validée' });
            alert('Billet validé avec succès !');
            loadOrganizerReservations();
            document.getElementById('qrInput').value = ''; // Réinitialiser l'input
        });
    } catch (error) {
        console.error('Erreur lors du chargement des réservations :', error);
        alert('Impossible de charger les réservations. Veuillez réessayer.');
    }
}

window.validateReservation = async function(reservationId) {
    try {
        const db = window.db;
        await updateDoc(doc(db, 'reservations', reservationId), { status: 'validée' });
        alert('Réservation validée !');
        loadOrganizerReservations();
    } catch (error) {
        console.error('Erreur lors de la validation de la réservation :', error);
        alert('Erreur lors de la validation. Veuillez réessayer.');
    }
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
