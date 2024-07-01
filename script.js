// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getDatabase, ref, set, onValue, push, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAwlzvEV2Rz3Qg65ldJS9szYSrhIk7mmJc",
    authDomain: "demolobby-e555b.firebaseapp.com",
    databaseURL: "https://demolobby-e555b-default-rtdb.firebaseio.com",
    projectId: "demolobby-e555b",
    storageBucket: "demolobby-e555b.appspot.com",
    messagingSenderId: "660754854141",
    appId: "1:660754854141:web:9aa05a8ac9a7df1f57ce94",
    measurementId: "G-6F3WBV9HHZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const auth = getAuth();

let userUid = null;
let userKey = null; // To store the user's key in the database

        // JavaScript code to ensure buttons are disabled on page load
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('helloButton').disabled = true;
            document.getElementById('goodbyeButton').disabled = true;
        });

// Anonymous Authentication
signInAnonymously(auth)
    .then((userCredential) => {
        userUid = userCredential.user.uid;
        console.log('Signed in anonymously:', userUid);
        updateLobbyStatus('Joining Lobby...');
        joinLobby();
    })
    .catch((error) => {
        console.error('Authentication failed:', error);
    });

onAuthStateChanged(auth, (user) => {
    if (user) {
        userUid = user.uid;
        console.log('User signed in:', userUid);
    } else {
        userUid = null;
        console.log('No user signed in');
    }
});

// Function to write current time to Firebase
const writeCurrentTime = () => {
    const currentTime = new Date().toLocaleString();
    const timeRef = ref(database, `currentTime`);
    set(timeRef, {
        time: currentTime
    }).then(() => {
        console.log('Current time written to Firebase');
    }).catch((error) => {
        console.error('Error writing time to Firebase:', error);
    });
};

// Function to write custom text to Firebase
const writeCustomText = () => {
    const text = document.getElementById('customText').value;
    if (text.trim() === "") {
        alert("Please enter some text.");
        return;
    }
    const textRef = ref(database, `customText`);
    set(textRef, {
        text: text
    }).then(() => {
        console.log('Custom text written to Firebase');
    }).catch((error) => {
        console.error('Error writing text to Firebase:', error);
    });
};

// Function to read current time from Firebase
const readCurrentTime = () => {
    const timeRef = ref(database, 'currentTime');
    onValue(timeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log('Current time from Firebase:', data.time);
            document.getElementById('currentTimeDisplay').innerText = `Current Time: ${data.time}`;
        }
    }, {
        onlyOnce: false
    });
};

// Function to read custom text from Firebase
const readCustomText = () => {
    const textRef = ref(database, 'customText');
    onValue(textRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log('Custom text from Firebase:', data.text);
            document.getElementById('customTextDisplay').innerText = `Custom Text: ${data.text}`;
        }
    }, {
        onlyOnce: false
    });
};

// Function to join the lobby
const joinLobby = () => {
    const lobbyRef = ref(database, 'lobbies/default/users');
    const userRef = push(lobbyRef); // Create a unique key for this user
    userKey = userRef.key;
    set(userRef, {
        uid: userUid
    }).then(() => {
        console.log('Joined lobby');
        updateLobbyStatus('Joined Lobby');
        monitorLobbyUsers();
        // Set up disconnect operation to remove the user
        const disconnectRef = ref(database, `lobbies/default/users/${userKey}`);
        onDisconnect(disconnectRef).remove().then(() => {
            console.log('Disconnect operation set up for user');
        }).catch((error) => {
            console.error('Error setting up disconnect operation:', error);
        });
    }).catch((error) => {
        console.error('Error joining lobby:', error);
    });
};

// Function to monitor users in the lobby
const monitorLobbyUsers = () => {
    const lobbyUsersRef = ref(database, 'lobbies/default/users');
    onValue(lobbyUsersRef, (snapshot) => {
        const users = [];
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            users.push(user.uid);
        });
        updateLobbyUsersList(users);
    });
};

// Function to update lobby status
const updateLobbyStatus = (status) => {
    document.getElementById('lobbyStatus').innerText = `Status: ${status}`;
};

// Function to update the list of users in the lobby
const updateLobbyUsersList = (users) => {
    const usersListElement = document.getElementById('usersList');
    usersListElement.innerHTML = '';
    users.forEach((uid) => {
        const li = document.createElement('li');
        li.textContent = uid;
        usersListElement.appendChild(li);
    });
};

// Event listeners for buttons
document.getElementById('writeTimeButton').addEventListener('click', writeCurrentTime);
document.getElementById('writeTextButton').addEventListener('click', writeCustomText);
document.getElementById('joinLobbyButton').addEventListener('click', joinLobby);

// Function to leave the lobby
document.getElementById('leaveLobbyButton').addEventListener('click', () => {
    const userRef = ref(database, `lobbies/default/users/${userKey}`);
    remove(userRef)
        .then(() => {
            console.log('Left lobby');
            updateLobbyStatus('Left Lobby');
        })
        .catch((error) => {
            console.error('Error leaving lobby:', error);
        });
});

// Call read functions initially
readCurrentTime();
readCustomText();
