import { collection, getDocs, updateDoc, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

async function checkReservations() {
    const db = window.db;
    const reservations = await getDocs(collection(db, 'reservations'));
    const now = new Date();

    reservations.forEach(async resDoc => {
        const res = resDoc.data();
        if (res.status === 'en attente' && res.paymentDue) {
            const dueDate = res.paymentDue.toDate();
            if (now > dueDate) {
                await deleteDoc(doc(db, 'reservations', resDoc.id));
                console.log(`Réservation ${resDoc.id} annulée pour non-paiement.`);
            } else if (now > new Date(dueDate - 24 * 60 * 60 * 1000)) {
                console.log(`Rappel envoyé pour la réservation ${resDoc.id}.`);
            }
        }
    });
}

setInterval(checkReservations, 60000);
checkReservations();