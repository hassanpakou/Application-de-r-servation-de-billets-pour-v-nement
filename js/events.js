import { collection, getDocs, getDoc, addDoc, updateDoc, doc, where, query, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

export async function loadEvents() {
    const db = window.db;
    const eventList = document.getElementById('eventList');
    if (!eventList) return;
    eventList.innerHTML = '';
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    eventsSnapshot.forEach(doc => {
        const event = doc.data();
        const card = `
            <div class="col-md-4">
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
                        <button class="btn btn-primary" onclick="reserveTicket('${doc.id}', 'acompte')">Payer un Acompte</button>
                        <button class="btn btn-success" onclick="reserveTicket('${doc.id}', 'complet')">Paiement Complet</button>
                    </div>
                </div>
            </div>`;
        eventList.innerHTML += card;
    });
}

export async function reserveTicket(eventId, type) {
    const auth = window.auth;
    const db = window.db;
    const user = auth.currentUser;
    if (!user) {
        alert('Veuillez vous connecter.');
        return;
    }
    const category = document.getElementById(`category_${eventId}`).value;
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    const event = eventDoc.data();
    if (event.seats <= 0) {
        alert('Aucune place disponible.');
        return;
    }

    const price = category === 'vip' ? event.price + event.vipPrice : event.price;
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

    await addDoc(collection(db, 'reservations'), reservation);
    await updateDoc(doc(db, 'events', eventId), { seats: event.seats - 1 });

    if (type === 'complet') {
        console.log('Paiement effectué');
        const qrData = `${user.uid}-${eventId}-${category}`;
        const qrCodeDiv = document.createElement('div');
        qrCodeDiv.id = `qr_${eventId}`;
        document.getElementById('reservationStatus').appendChild(qrCodeDiv);
        QRCode.toCanvas(qrCodeDiv, qrData, { width: 200 });
        console.log(`Confirmation envoyée pour la réservation de ${event.name}.`);
    } else {
        console.log(`Rappel de paiement envoyé pour la réservation de ${event.name}.`);
    }
    loadReservations();
}

export async function loadReservations() {
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
                ${res.status === 'en attente' ? `Paiement dû avant: ${res.paymentDue.toDate().toLocaleDateString()}` : ''}
            </div>`;
    });
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
