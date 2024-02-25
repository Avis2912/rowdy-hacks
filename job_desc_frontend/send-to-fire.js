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
  
// Your existing Firebase initialization remains the same
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

// New function to read and extract text from a PDF file
function readPdf(file) {
    // Use pdf.js library here to read the PDF
    // This is a simplified example; refer to the pdf.js documentation for complete usage
    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedarray).promise.then(pdf => {
            let texts = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                pdf.getPage(i).then(page => {
                    page.getTextContent().then(content => {
                        // Concatenate the strings from each piece of text content
                        const strings = content.items.map(item => item.str);
                        texts += strings.join(' ') + '\n'; // Add a new line for each page for readability

                        // Assuming you want to store text after the last page is read
                        if (i === pdf.numPages) {
                            storePdfText(texts); // Call function to store text in Firestore
                        }
                    });
                });
            }
        }).catch(err => {
            console.error('Error reading PDF: ', err);
        });
    };
    fileReader.readAsArrayBuffer(file);
}

// Function to store extracted text in Firestore
function storePdfText(texts) {
    const company = document.getElementById('company').value;
    const position = document.getElementById('position').value;
    db.collection('jobDescriptions').add({
        company: company,
        position: position,
        pdfText: texts, // Store the extracted text from PDF
    }).then(() => {
        console.log("Document successfully written with PDF text!");
    }).catch((error) => {
        console.error("Error writing document: ", error);
    });
}

// Modified submitData function to handle PDF upload and extraction
function submitData() {
    const pdfFile = document.getElementById('pdfUpload').files[0]; // Get the uploaded PDF file
    if (pdfFile) {
        readPdf(pdfFile); // Read and extract text from the PDF
    } else {
        console.log("No PDF file selected.");
    }
}

// Event listeners remain the same
document.getElementById('submit').addEventListener('click', submitData);
document.getElementById('generate').addEventListener('click', () => {
    // Generate something or another Firebase call
});
