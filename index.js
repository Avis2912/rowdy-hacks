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
  const db = firebase.firestore();
  
  // const { Storage } = require('@google-cloud/storage');
  // const storage = new Storage({ keyFilename: 'f7db63e1d61c3a6d1e2f02c10f3cd4bbf4e8a449.json' });
  

  
  import './streaming-client-api.js';
  
  // Continue with your Firebase and application code