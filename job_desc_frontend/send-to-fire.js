// Initialize Firebase (replace with your own config)
const firebaseConfig = {
    apiKey: "AIzaSyBjIHbJnt1l5eh1zfxXcnce4bpzVVLQsbU",
    authDomain: "restful-cbcd4.firebaseapp.com",
    projectId: "restful-cbcd4",
    storageBucket: "restful-cbcd4.appspot.com",
    messagingSenderId: "205445907884",
    appId: "1:205445907884:web:538aee7dc0b42c0c386609",
    measurementId: "G-FZRFK5VRBY"
  };
  
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

// Function to handle form submission
function submitData() {
    const company = document.getElementById('company').value;
    const position = document.getElementById('position').value;
    // Assuming you want to store company and position. Adjust according to your needs.
    db.collection('jobDescriptions').add({
        company: company,
        position: position,
        // You can add more fields here
    }).then(() => {
        console.log("Document successfully written!");
    }).catch((error) => {
        console.error("Error writing document: ", error);
    });
}

// Event listeners for your buttons
document.getElementById('submit').addEventListener('click', submitData);

// If 'generate' button does something else related to Firebase, add its functionality here
document.getElementById('generate').addEventListener('click', () => {
    // Generate something or another Firebase call
});
