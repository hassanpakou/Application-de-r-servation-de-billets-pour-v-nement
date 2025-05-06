const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signOut } = require('firebase/auth');
const { getFirestore, collection, addDoc, setDoc, doc, getDocs, where, query, serverTimestamp, Timestamp } = require('firebase/firestore');

// Configuration Firebase (remplacez par vos identifiants)
const firebaseConfig = {
    apiKey: "AIzaSyDsHiCvpCg7KyvgtsYlnjUxM-CPokaay9s",
    authDomain: "eventticketreservation-eda8e.firebaseapp.com",
    projectId: "eventticketreservation-eda8e",
    storageBucket: "eventticketreservation-eda8e.firebasestorage.app",
    messagingSenderId: "701269523112",
    appId: "1:701269523112:web:143abe903cba904923a09d"
  };

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Fonction pour initialiser les données
async function initializeFirestore() {
    try {
        // 1. Ajouter des utilisateurs (admin, organisateur, utilisateur standard)
        const users = [
            { email: "phakunestor@gmail.com", password: "123456", role: "admin" },
            { email: "simonemawa01@gmail.com", password: "123456", role: "organizer" },
            { email: "djafarheritier@gmail.com", password: "123456", role: "user" }
        ];
        for (const user of users) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email: user.email,
                    role: user.role,
                    createdAt: serverTimestamp()
                });
                console.log(`Utilisateur créé : ${user.email}`);
            } catch (error) {
                if (error.code === 'auth/email-already-in-use') {
                    console.log(`Utilisateur ${user.email} existe déjà.`);
                } else {
                    throw error;
                }
            }
        }

        // Se déconnecter pour éviter les conflits
        await signOut(auth);

        // 2. Ajouter des événements
        const events = [
            {
                name: "Concert de Rock",
                date: "2025-06-01",
                seats: 100,
                price: 20.0,
                vipPrice: 10.0,
                createdAt: serverTimestamp()
            },
            {
                name: "Théâtre Classique",
                date: "2025-06-15",
                seats: 50,
                price: 15.0,
                vipPrice: 5.0,
                createdAt: serverTimestamp()
            },
            {
                name: "Cinéma en Plein Air",
                date: "2025-07-01",
                seats: 200,
                price: 10.0,
                vipPrice: 3.0,
                createdAt: serverTimestamp()
            }
        ];

        for (const event of events) {
            const eventRef = await addDoc(collection(db, 'events'), event);
            console.log(`Événement créé : ${event.name} (ID: ${eventRef.id})`);
        }

        // 3. Ajouter des réservations (en utilisant l'utilisateur standard et les événements créés)
        const userQuery = query(collection(db, 'users'), where('email', '==', 'user@example.com'));
        const userDocs = await getDocs(userQuery);
        if (userDocs.empty) throw new Error("Utilisateur user@example.com non trouvé.");
        const userId = userDocs.docs[0].id;

        const eventDocs = await getDocs(collection(db, 'events'));
        const eventIds = eventDocs.docs.map(doc => doc.id);

        const reservations = [
            {
                userId: userId,
                eventId: eventIds[0],
                category: "standard",
                type: "complet",
                price: 20.0,
                status: "confirmée",
                timestamp: serverTimestamp(),
                paymentDue: null
            },
            {
                userId: userId,
                eventId: eventIds[1],
                category: "vip",
                type: "acompte",
                price: 10.0, // 50% de (15 + 5)
                status: "en attente",
                timestamp: serverTimestamp(),
                paymentDue: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
            }
        ];

        for (const reservation of reservations) {
            await addDoc(collection(db, 'reservations'), reservation);
            console.log(`Réservation créée pour l'événement ${reservation.eventId}`);
        }

        console.log("Initialisation de Firestore terminée avec succès !");
    } catch (error) {
        console.error("Erreur lors de l'initialisation : ", error);
    }
}

// Exécuter l'initialisation
initializeFirestore().then(() => {
    console.log("Script terminé.");
    process.exit(0);
}).catch(error => {
    console.error("Échec du script : ", error);
    process.exit(1);
});










