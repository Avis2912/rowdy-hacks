let OPENAI_API_KEY;
fetch('./config.json')
  .then((response) => response.json())
  .then(async (config) => {
    OPENAI_API_KEY = config.OPENAI_API_KEY;
  })
  .catch((error) => {
    console.error('Error loading config.json:', error);
  });


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
  
  const companyInput = document.getElementsByClassName('company-name-input')[0];
  const jobTitleInput = document.getElementsByClassName('job-title-input')[0];
  const jobDescriptionInput = document.getElementsByClassName('job-description-input')[0];
  const generateButton = document.getElementsByClassName('generateBtn')[0];
  const submitButton = document.getElementsByClassName('submitBtn')[0];
  

  const docRef = firebase.firestore().collection('conversations').doc('details');

    

  generateButton.addEventListener('click', async function() {


    const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", "content": `Generate a 6-point job description for 
        a ${jobTitleInput.value} at ${companyInput.value}.` }
      ],      
      temperature: 0.5,
      max_tokens: 150,
    }),
  });

  
  if (!response.ok) {
    throw new Error(`OpenAI API request failed with status ${response.status}`);
  }
  const data = await response.json();
  jobDescriptionInput.innerHTML = data.choices[0].message.content.trim();
    
  });



  //SUBMIT

  submitButton.addEventListener('click', function() {
    docRef.update({
        company: companyInput.value,
        jobTitle: jobTitleInput.value,
        jobDescription: jobDescriptionInput.value
    }).then(() => {
        console.log("Document successfully updated!");
        window.location.href = "index.html"; 
        console.error("Error updating document: ", error);
    });
});






  

  // Continue with your Firebase and application code