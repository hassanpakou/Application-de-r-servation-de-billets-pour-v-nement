import { collection, getDocs, getDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

async function checkReservations() {
    try {
        const db = window.db;
        if (!db) {
            console.warn('Firestore non initialisé. Nouvelle tentative dans 1 seconde.');
            setTimeout(checkReservations, 1000); // Réessayer après 1 seconde
            return;
        }
        const reservations = await getDocs(collection(db, 'reservations'));
        const now = new Date();

        reservations.forEach(async resDoc => {
            const res = resDoc.data();
            if (res.status === 'en attente' && res.paymentDue) {
                const dueDate = res.paymentDue.toDate();
                const eventDoc = await getDoc(doc(db, 'events', res.eventId));
                if (!eventDoc.exists()) {
                    console.error(`Événement ${res.eventId} non trouvé pour la réservation ${resDoc.id}.`);
                    return;
                }
                const eventName = eventDoc.data().name;

                if (now > dueDate) {
                    await deleteDoc(doc(db, 'reservations', resDoc.id));
                    console.log(`Réservation ${resDoc.id} pour ${eventName} annulée pour non-paiement du solde.`);
                } else if (now > new Date(dueDate - 24 * 60 * 60 * 1000)) {
                    console.log(`Rappel : Veuillez payer le solde pour la réservation ${resDoc.id} (${eventName}) avant ${dueDate.toLocaleDateString()}.`);
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la vérification des réservations :', error);
    }
}

function startCheckingReservations() {
    checkReservations();
    setInterval(checkReservations, 60000); // Vérifier toutes les 60 secondes
}

startCheckingReservations();
