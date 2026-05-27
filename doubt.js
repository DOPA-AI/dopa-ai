// Check immediately when page starts loading if user session cookie mock is true
if (localStorage.getItem("isLoggedIn") !== "true") {
  // If not logged in, violently boot them back to the verification screen
  window.location.href = "auth.html";
}

// ── SPEECH RECOGNITION ──
let recognition = null;
let isListening = false;

// ── FILE UPLOAD ──
let uploadedImageBase64 = null;
let uploadedImageType = null;
let uploadedFileName = "";

// ── MAIN SOLVE FUNCTION ──
async function solveDoubt() {
  const question = document.getElementById("questionInput").value.trim();

  if (!question && !uploadedImageBase64) {
    alert("Please type a question, speak, or upload an image!");
    return;
  }

  document.getElementById("answerText").innerHTML = "Thinking... ⏳";

  try {
    const answer = await solveWithGroq(question, uploadedImageBase64, uploadedImageType);
    displayAnswer(answer, question);

  } catch (error) {
    document.getElementById("answerText").innerHTML =
      "<p style='color:red'>Error: " + error.message + "</p>";
  }
}

// ── GROQ SOLVER (TEXT & VISION VIA SERVERLESS BACKEND) ──
async function solveWithGroq(question, base64Data = null, mimeType = null) {
  // Added standard instruction telling the AI to format equations cleanly using LaTeX format
  const systemPrompt = "You are DOPA AI, a friendly study assistant for students. Answer questions in simple clear points. Use ## for main section headings and ** for sub point names. Never use bullet points or numbered lists. Use standard LaTeX syntax for mathematical symbols, variables, or equations (e.g. use \\[ and \\] for display equations, and \\( and \\) for inline formulas). Respond in ENGLISH ONLY.";
  const userPrompt = question || "Look at this image carefully and explain everything in it clearly for a student. If it contains a question, answer it.";

  let modelName = "llama-3.1-8b-instant"; 
  let messagesPayload = [];

  if (base64Data) {
    modelName = "meta-llama/llama-4-scout-17b-16e-instruct"; 
    messagesPayload = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Data}` }
          }
        ]
      }
    ];
  } else {
    messagesPayload = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];
  }

  // Secure backend routing channel hitting our internal Netlify serverless gateway
  const response = await fetch("/.netlify/functions/askGroq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelName,
      messages: messagesPayload
    })
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.choices[0].message.content;
}

// ── DISPLAY ANSWER ──
function displayAnswer(answer, question) {
  const lines = answer.split("\n");
  let html = "";

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    if (line.match(/^#{1,6}\s*/)) {
      const text = line.replace(/^#{1,6}\s*/, "").replace(/\*\//g, "").trim();
      if (text) html += `<h3 class="sub-question">${text}</h3>`;

    } else if (line.match(/^\*\*(.*?)\*\*/)) {
      const text = line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/^:\s*/, "").trim();
      if (text) html += `<h4 class="point-heading">${text}</h4>`;

    } else if (line.match(/^\d+\.\s*$/) || line.match(/^[-•]\s*$/)) {
      return;

    } else {
      // MODIFIED: Preserved backslashes so math tags like \[ and \( aren't broken
      const text = line
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/^:\s*/, "")
        .replace(/^[-•]\s*/, "")
        .trim();
      if (text) html += `<p class="answer-para">${text}</p>`;
    }
  });

  const stopWords = ["what","is","are","was","were","how","why","when","who","which","does","do","did","explain","define","tell","me","about","the","a","an","of","in","on","at","to","for","with","larger","points"];

  const questionText = question || (uploadedFileName ? uploadedFileName : "Answer");
  const words = questionText.toLowerCase()
    .replace(/[?.,!]/g, "")
    .split(" ")
    .filter(word => !stopWords.includes(word));

  const mainTopic = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Inject HTML into UI container
  document.getElementById("answerText").innerHTML = `
    <h2 class="topic-heading">${mainTopic || questionText}</h2>
    <div class="answer-content">${html}</div>
  `;

  // ADDED: Forces MathJax to dynamically scan and render the formulas instantly
  if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
    window.MathJax.typesetPromise([document.getElementById("answerText")]).catch(function (err) {
      console.error("MathJax conversion failed: ", err);
    });
  }
}

// ── HANDLE FILE UPLOAD ──
function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const uploadText = document.getElementById("uploadText");
  uploadedFileName = file.name;

  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedImageBase64 = e.target.result.split(",")[1];
    uploadedImageType = file.type;

    document.getElementById("previewImg").src = e.target.result;
    document.getElementById("imagePreview").style.display = "flex";
    uploadText.innerText = "✅ Image uploaded: " + file.name;
  };
  reader.readAsDataURL(file);
}

// ── REMOVE FILE ──
function removeImage() {
  uploadedImageBase64 = null;
  uploadedImageType = null;
  uploadedFileName = "";
  document.getElementById("imageUpload").value = "";
  document.getElementById("imagePreview").style.display = "none";
  document.getElementById("uploadText").innerText = "Upload Image of your question";
}

// ── SPEECH TO TEXT ──
function startSpeech() {
  const micBtn = document.getElementById("micBtn");
  const micStatus = document.getElementById("micStatus");

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert("Please use Chrome browser for speech!");
    return;
  }

  if (isListening) {
    recognition.stop();
    isListening = false;
    micBtn.innerHTML = "🎤";
    micBtn.classList.remove("mic-active");
    micStatus.innerHTML = "<p class='mic-done'>✅ Done! Click Get Answer</p>";
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.lang = 'en-IN';
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = function() {
    isListening = true;
    micBtn.innerHTML = "🔴";
    micBtn.classList.add("mic-active");
    micStatus.innerHTML = "<p class='mic-listening'>🎤 Listening... Click 🔴 to stop</p>";
  };

  recognition.onresult = function(event) {
    let fullText = "";
    for (let i = 0; i < event.results.length; i++) {
      fullText += event.results[i][0].transcript + " ";
    }
    document.getElementById("questionInput").value = fullText.trim();
    micStatus.innerHTML = "<p class='mic-listening'>🎤 Still listening... Click 🔴 to stop</p>";
  };

  recognition.onerror = function(event) {
    isListening = false;
    micBtn.innerHTML = "🎤";
    micBtn.classList.remove("mic-active");
    if (event.error === "not-allowed") {
      micStatus.innerHTML = "<p class='mic-error'>❌ Allow microphone access!</p>";
    } else {
      micStatus.innerHTML = "<p class='mic-error'>❌ Error: " + event.error + "</p>";
    }
  };

  recognition.onend = function() {
    if (isListening) recognition.start();
  };

  recognition.start();
}