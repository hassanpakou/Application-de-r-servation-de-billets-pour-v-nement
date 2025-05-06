import { collection, getDocs, getDoc, addDoc, updateDoc, doc, where, query, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

export async function loadEvents() {
    try {
        const db = window.db;
        const eventList = document.getElementById('eventList');
        if (!eventList) return;
        eventList.innerHTML = '';
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        eventsSnapshot.forEach(doc => {
            const event = doc.data();
            const card = document.createElement('div');
            card.className = 'col-md-4';
            card.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${event.name}</h5>
                        <p class="card-text">
                            Date: ${event.date}<br>
                            Places: ${event.seats}<br>
                            Prix: ${event.price}€ (VIP: +${event.vipPrice}€)
                        </p>
                        <select id="category_${doc.id}" class="form-select mb-2">
                            <option value="standard">Standard</option>
                            <option value="vip">VIP</option>
                        </select>
                        <input type="number" id="payment_${doc.id}" class="form-control mb-2" placeholder="Montant payé (€)" min="0" step="0.01">
                        <button class="btn btn-primary btn-acompte" data-event-id="${doc.id}">Payer un Acompte</button>
                        <button class="btn btn-success btn-complet" data-event-id="${doc.id}">Paiement Complet</button>
                    </div>
                </div>`;
            eventList.appendChild(card);
        });

        // Attacher les écouteurs d'événements aux boutons
        document.querySelectorAll('.btn-acompte').forEach(button => {
            button.addEventListener('click', () => {
                const eventId = button.getAttribute('data-event-id');
                reserveTicket(eventId, 'acompte');
            });
        });
        document.querySelectorAll('.btn-complet').forEach(button => {
            button.addEventListener('click', () => {
                const eventId = button.getAttribute('data-event-id');
                reserveTicket(eventId, 'complet');
            });
        });
    } catch (error) {
        console.error('Erreur lors du chargement des événements :', error);
        alert('Impossible de charger les événements. Veuillez réessayer.');
    }
}

export async function reserveTicket(eventId, type) {
    try {
        const auth = window.auth;
        const db = window.db;
        const user = auth.currentUser;
        if (!user) {
            alert('Veuillez vous connecter.');
            return;
        }
        const category = document.getElementById(`category_${eventId}`).value;
        const paymentInput = document.getElementById(`payment_${eventId}`).value;
        const paymentAmount = parseFloat(paymentInput) || 0;

        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists()) {
            alert('Événement non trouvé.');
            return;
        }
        const event = eventDoc.data();
        if (event.seats <= 0) {
            alert('Aucune place disponible.');
            return;
        }

        const price = category === 'vip' ? event.price + event.vipPrice : event.price;
        const requiredAmount = type === 'acompte' ? price * 0.5 : price;

        if (paymentAmount < requiredAmount) {
            alert(`Montant insuffisant. Veuillez saisir au moins ${requiredAmount}€.`);
            return;
        }

        const reservation = {
            userId: user.uid,
            eventId,
            category,
            type,
            price: type === 'acompte' ? price * 0.5 : price,
            status: type === 'acompte' ? 'en attente' : 'confirmée',
            timestamp: serverTimestamp(),
            paymentDue: type === 'acompte' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null
        };

        const reservationRef = await addDoc(collection(db, 'reservations'), reservation);
        await updateDoc(doc(db, 'events', eventId), { seats: event.seats - 1 });

        if (type === 'complet') {
            console.log('Paiement complet effectué');
            const qrData = `${user.uid}-${eventId}-${category}-${reservationRef.id}`;
            const qrCodeDiv = document.createElement('div');
            qrCodeDiv.id = `qr_${eventId}`;
            document.getElementById('reservationStatus').appendChild(qrCodeDiv);
            QRCode.toCanvas(qrCodeDiv, qrData, { width: 200 }, (err) => {
                if (err) console.error('Erreur lors de la génération du QR code :', err);
            });
            console.log(`Confirmation envoyée pour la réservation de ${event.name}.`);
        } else {
            console.log(`Acompte payé pour la réservation de ${event.name}.`);
        }

        loadReservations();
        document.getElementById(`payment_${eventId}`).value = ''; // Réinitialiser l'input
    } catch (error) {
        console.error('Erreur lors de la réservation :', error);
        alert('Erreur lors de la réservation. Veuillez réessayer.');
    }
}

export async function loadReservations() {
    try {
        const auth = window.auth;
        const db = window.db;
        const user = auth.currentUser;
        if (!user) return;
        const reservationStatus = document.getElementById('reservationStatus');
        if (!reservationStatus) return;
        reservationStatus.innerHTML = '<h3>Vos Réservations</h3>';
        const reservations = await getDocs(query(collection(db, 'reservations'), where('userId', '==', user.uid)));
        reservations.forEach(async doc => {
            const res = doc.data();
            const event = (await getDoc(doc(db, 'events', res.eventId))).data();
            reservationStatus.innerHTML += `
                <div class="alert alert-info">
                    Événement: ${event.name}<br>
                    Catégorie: ${res.category}<br>
                    Statut: ${res.status}<br>
                    Prix: ${res.price}€<br>
                    ${res.status === 'en attente' ? `
                        Paiement dû avant: ${res.paymentDue.toDate().toLocaleDateString()}<br>
                        <input type="number" id="balance_${doc.id}" class="form-control mb-2" placeholder="Payer le solde (€)" min="0" step="0.01">
                        <button class="btn btn-success btn-pay-balance" data-reservation-id="${doc.id}" data-total-price="${res.price * 2}">Payer le Solde</button>
                    ` : ''}
                </div>`;
        });

        // Attacher les écouteurs d'événements aux boutons "Payer le Solde"
        document.querySelectorAll('.btn-pay-balance').forEach(button => {
            button.addEventListener('click', () => {
                const reservationId = button.getAttribute('data-reservation-id');
                const totalPrice = parseFloat(button.getAttribute('data-total-price'));
                payBalance(reservationId, totalPrice);
            });
        });
    } catch (error) {
        console.error('Erreur lors du chargement des réservations :', error);
        alert('Impossible de charger les réservations. Veuillez réessayer.');
    }
}

export async function payBalance(reservationId, totalPrice) {
    try {
        const db = window.db;
        const auth = window.auth;
        const user = auth.currentUser;
        if (!user) {
            alert('Veuillez vous connecter.');
            return;
        }
        const paymentInput = document.getElementById(`balance_${reservationId}`).value;
        const paymentAmount = parseFloat(paymentInput) || 0;
        const requiredBalance = totalPrice - (totalPrice / 2); // Solde = prix total - acompte

        if (paymentAmount < requiredBalance) {
            alert(`Montant insuffisant. Veuillez saisir au moins ${requiredBalance}€.`);
            return;
        }

        const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
        if (!reservationDoc.exists()) {
            alert('Réservation non trouvée.');
            return;
        }
        const reservation = reservationDoc.data();
        await updateDoc(doc(db, 'reservations', reservationId), { status: 'confirmée', paymentDue: null });

        const qrData = `${user.uid}-${reservation.eventId}-${reservation.category}-${reservationId}`;
        const qrCodeDiv = document.createElement('div');
        qrCodeDiv.id = `qr_${reservationId}`;
        document.getElementById('reservationStatus').appendChild(qrCodeDiv);
        QRCode.toCanvas(qrCodeDiv, qrData, { width: 200 }, (err) => {
            if (err) console.error('Erreur lors de la génération du QR code :', err);
        });
        console.log(`Solde payé. Confirmation envoyée pour la réservation.`);

        loadReservations();
        document.getElementById(`balance_${reservationId}`).value = ''; // Réinitialiser l'input
    } catch (error) {
        console.error('Erreur lors du paiement du solde :', error);
        alert('Erreur lors du paiement du solde. Veuillez réessayer.');
    }
}

document.getElementById('userMenu')?.addEventListener('click', () => {
    showSection('userSection');
    loadEvents();
    loadReservations();
});

if (window.location.pathname.includes('index.html')) {
    loadEvents();
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    document.getElementById(sectionId)?.classList.remove('d-none');
}
