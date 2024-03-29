//working DONOTEDIT
//CMD C:\Projects\DID\streams_Oct>node app.js on http://localhost:3000/

'use strict';
// import { record } from 'node-record-lpcm16';
import DID_API from './api.json' assert { type: 'json' };
// import 'firebase/storage'; 

if (DID_API.key == '🤫') alert('Please put your API key inside ./api.json and restart.');


// Load the OpenAI API from file new 10/23 
let OPENAI_API_KEY;
fetch('./config.json')
  .then((response) => response.json())
  .then(async (config) => {
    OPENAI_API_KEY = config.OPENAI_API_KEY;
  })
  .catch((error) => {
    console.error('Error loading config.json:', error);
  });

  let messageHistory = []; // Array to store previous messages
  let context = []; // Array to store previous messages
  let isFirstOpenAIRequest = true; 

  const captureUserVideo = () => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
  
    // Draw the user's video onto the canvas
    context.drawImage(talkVideo, 0, 0, canvas.width, canvas.height);
  
    return canvas;
  };

  function canvasDataURLToBuffer(dataURL) {
    // Extract the base64 data from the data URL
    const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode the base64 data to a Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    return buffer;
  }
  
  const uploadImageToGCP = async (canvas) => {
    // Convert the canvas to a data URL
    const imageDataURL = await canvas.toDataURL();
  
    const bucketName = 'rowdy-hacks';
    const bucket = storage.bucket(bucketName);
    const imageName = 'user_video_image.jpg';
    const imageFile = bucket.file(imageName);

    const imageDataBuffer = await canvasDataURLToBuffer(imageDataURL);

    // Upload the image to Cloud Storage
    imageFile.save(imageDataBuffer, { contentType: 'image/jpeg' }, (err) => {
      if (err) {
        console.error('Error uploading image to Google Cloud Storage:', err);
      } else {
        console.log('Image uploaded to Google Cloud Storage');
      }
    });

  };
  
// OpenAI API endpoint set up new 10/23 
async function fetchOpenAIResponse(userMessage) {

  if (isFirstOpenAIRequest) {
    isFirstOpenAIRequest = false; // Update the flag
    const userVideoCanvas = captureUserVideo(); // Function to capture the user's video
    uploadImageToGCP(userVideoCanvas); // Function to upload the captured image to Firebase Storage
  }


  let userDetails = {}

  let docRef1 = firebase.firestore().collection('conversations').doc('details');
    await docRef1.get().then((doc) => {
    if (doc.exists) {
        // Document data exists, retrieve the fields
        const data = doc.data();
        const company = data.company;
        const jobTitle = data.jobTitle;
        const jobDescription = data.jobDescription;
  
        // Construct a JSON object with the retrieved data
        const jsonObject = {
            company: company,
            jobTitle: jobTitle,
            jobDescription: jobDescription
        };

        userDetails = jsonObject;
  
        // Log the JSON object
        console.log("JSON object:", jsonObject);
    } else {
        // Document doesn't exist
        console.log("No such document!");
    }
  }).catch((error) => {
    console.error("Error getting document:", error);
  });

  console.log("PLUH object:", userDetails);



  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", "content": `You're Chris, my AI interviewer 
          for a software engineering role at ${userDetails.company}.

          First inform me you're interviewing for the company and ask me more about my
          experience at Capital One.

          THEN Ask me the following questions in order, ONLY one at a time.

          How do you code a linked tree?

          Then end by saying thank you for taking this short miniature interview.` 
        },
        ...messageHistory,
        { "role": "user", "content": userMessage }
      ],      
      temperature: 0.5,
      max_tokens: 25
    }),
  });

  
  if (!response.ok) {
    throw new Error(`OpenAI API request failed with status ${response.status}`);
  }
  const data = await response.json();
  return data.choices[0].message.content.trim();
}
  
//same  - No edits from Github example for this whole section
const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;

let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;

const talkVideo = document.getElementById('talk-video');
talkVideo.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  connectButton.style.display = 'none';
  destroyButton.style.display = 'flex';

  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }

  stopAllStreams();
  closePC();

  const sessionResponse = await fetch(`${DID_API.url}/talks/streams`, {
    method: 'POST',
    headers: {'Authorization': `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      source_url: "https://raw.githubusercontent.com/jjmlovesgit/D-id_Streaming_Chatgpt/main/oracle_pic.jpg",
    }),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json()
  streamId = newStreamId;
  sessionId = newSessionId;
  
  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.log('error during streaming setup', e);
    stopAllStreams();
    closePC();
    return;
  }

  const sdpResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}/sdp`,
    {
      method: 'POST',
      headers: {Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({answer: sessionClientAnswer, session_id: sessionId})
    });
};

// This is changed to accept the ChatGPT response as Text input to D-ID #138 responseFromOpenAI 
const talkButton = document.getElementById('talk-button');
talkButton.onclick = async () => {
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    
    // const userInput = document.getElementById('user-input-field').value;   
    //////////////////////////////////////////////////////////
    
    try {
      
    const recordedVoiceCommand = await recordVoiceCommand();
    console.log("RECORDED:", recordedVoiceCommand);


    const responseFromOpenAI = await fetchOpenAIResponse(recordedVoiceCommand);
    console.log("OpenAI Response:", responseFromOpenAI);

    // Check if recordedVoiceCommand and responseFromOpenAI are not empty before pushing to messageHistory
    if (recordedVoiceCommand.trim) {
      messageHistory.push({ "role": "user", "content": recordedVoiceCommand });
    }
    if (responseFromOpenAI.trim) {
      messageHistory.push({ "role": "assistant", "content" : responseFromOpenAI });
    }

    console.log("Message History:", messageHistory);

    
  
      
    const docRef = firebase.firestore().collection('conversations').doc('conversations');
    // Create new objects for the 'ai' and 'user'
    const newAiEntry = { ai: recordedVoiceCommand };
    const newUserEntry = { user: responseFromOpenAI };

    // Update 'texts' array in the document by adding new 'ai' and 'user' maps
    docRef.update({
      texts: firebase.firestore.FieldValue.arrayUnion(newAiEntry, newUserEntry)
    }).then(() => {
      console.log("Document successfully updated!");
    }).catch(error => {
      console.error("Error updating document: ", error);
    });

    
    const talkResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
      method: 'POST',
      headers: { 
        Authorization: `Basic ${DID_API.key}`, 
        'Content-Type': 'application/json'
     },
      body: JSON.stringify({
        script: {
          type: 'text',
          subtitles: 'false',
          provider: { type: 'microsoft', voice_id: 'en-US-ChristopherNeural' },
          ssml: false,
          input: responseFromOpenAI  //send the openAIResponse to D-id
        },
        config: {
          fluent: true,
          pad_audio: 0,
          driver_expressions: {
            expressions: [{ expression: 'neutral', start_frame: 0, intensity: 0 }],
            transition_frames: 0
          },
          align_driver: true,
          align_expand_factor: 0,
          auto_match: true,
          motion_factor: 0,
          normalization_factor: 0,
          sharpen: true,
          stitch: true,
          result_format: 'mp4'
        },
        'driver_url': 'bank://lively/',
        'config': {
          'stitch': true,
        },
        'session_id': sessionId
      })
    });
  }
  catch (error) { 
    console.error('Error talking:', error);
  }}};


const recordVoiceCommand = () => {
  talkButton.innerText = 'Listening...';
  talkButton.classList.add('activeBtn');
  return new Promise(async (resolve, reject) => {
    try {
      // Request access to the user's microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create a new MediaRecorder instance and pass in the audio stream
      const recorder = new MediaRecorder(stream);

      // Initialize an array to store audio chunks
      const audioChunks = [];

      // Event listener to handle when data becomes available
      recorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };

      // Event listener to handle when recording stops
      recorder.onstop = async () => {
        // Combine all audio chunks into a single Blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

        // Transcribe the recorded audio
        try {
          const transcriptionResult = await transcribeAudio(audioBlob);
          // console.log("Transcription result:", transcriptionResult.text);
          resolve(transcriptionResult.text); // Resolve the promise with the transcription result
        } catch (error) {
          console.error("Error transcribing audio:", error);
          reject(error); // Reject the promise if an error occurs during transcription
        }
      };

      // Start recording
      recorder.start();

      // Set a timeout to stop recording after a certain duration (in milliseconds)
      setTimeout(() => {
        recorder.stop();
        talkButton.classList.remove('activeBtn');
        talkButton.innerText = 'Speak 🎙️';
      }, 5000); 

    } catch (error) {
      console.error('Error recording voice command:', error);
      reject(error); // Reject the promise if an error occurs during recording
    }
  });
};


async function transcribeAudio(audioBlob) {
  const model = "whisper-1";

  const formData = new FormData();
  formData.append("model", model);
  formData.append("file", audioBlob, "audio.wav");

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: "Bearer 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",
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to transcribe audio');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

// NOTHING BELOW THIS LINE IS CHANGED FROM ORIGNAL D-id File Example
//

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  console.log('DESTROYED')
  await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();
};

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  console.log('onIceGatheringStateChange: ', peerConnection.iceGatheringState);
}
function onIceCandidate(event) {
  console.log('onIceCandidate', event);
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetch(`${DID_API.url}/talks/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
  }
}
function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
  }
  console.log('onIceConnectionStateChange: ', peerConnection.iceConnectionState);
}
function onConnectionStateChange() {
  // not supported in firefox
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  console.log('onConnectionStateChange: ', peerConnection.connectionState);
}
function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  console.log('onSignalingStateChange: ', peerConnection.signalingState);
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';
    const remoteStream = stream;
    setVideoElement(remoteStream);
  } else {
    status = 'empty';
    playIdleVideo();
  }
  streamingStatusLabel.innerText = status;
  streamingStatusLabel.className = 'streamingState-' + status;
  console.log('onVideoStatusChange: ', status);
}

function onTrack(event) {

  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track);
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

        if (videoStatusChanged) {
          videoIsPlaying = report.bytesReceived > lastBytesReceived;
          onVideoStatusChange(videoIsPlaying, event.streams[0]);
        }
        lastBytesReceived = report.bytesReceived;
      }
    });
  }, 500);
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  return sessionClientAnswer;
}

function setVideoElement(stream) {
  if (!stream) return;
  talkVideo.srcObject = stream;
  talkVideo.loop = false;

  // safari hotfix
  if (talkVideo.paused) {
    talkVideo
      .play()
      .then((_) => {})
      .catch((e) => {});
  }
}

function playIdleVideo() {
  talkVideo.srcObject = undefined;
  talkVideo.src = 'oracle_Idle.mp4';
  talkVideo.loop = true;
}

function stopAllStreams() {
  if (talkVideo.srcObject) {
    console.log('stopping video streams');
    talkVideo.srcObject.getTracks().forEach((track) => track.stop());
    talkVideo.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 3;
const maxDelaySec = 4;
// Default of 1 moved to 5
async function fetchWithRetries(url, options, retries = 3) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;

      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}