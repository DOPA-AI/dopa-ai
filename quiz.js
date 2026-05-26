// Check immediately when page starts loading if user session cookie mock is true
if (localStorage.getItem("isLoggedIn") !== "true") {
  // If not logged in, violently boot them back to the verification screen
  window.location.href = "auth.html";
}

// API Key
const GROQ_API_KEY = localStorage.getItem("groq_api_key") || "DEVELOPMENT_KEY_PLACEHOLDER";

// Track live exam session parameters
let totalQuestions = 0;
let correctAnswers = 0;
let answeredQuestions = 0;

async function generateQuiz() {
  const topic = document.getElementById("topicInput").value.trim();
  // FIXED: Fetch the user input for requested number of questions dynamically
  const questionCountInput = document.getElementById("numQuestions").value;
  const requestedCount = parseInt(questionCountInput) || 5; // Default fallback to 5 questions

  if (!topic) {
    alert("Please enter a topic first!");
    return;
  }

  document.getElementById("quizContent").innerHTML =
    "<p style='color:#C77DFF'>Generating your quiz... ⏳</p>";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are DOPA AI, a quiz generator for students. Generate exactly ${requestedCount} MCQ questions in the requested format only.`
          },
          {
            role: "user",
            content: `Create exactly ${requestedCount} MCQ questions about "${topic}" for students.
            Format each question EXACTLY like this:
            Q1. Question here?
            A) Option one
            B) Option two
            C) Option three
            D) Option four
            Answer: A

            Do this for all ${requestedCount} questions. Nothing else.`
          }
        ]
      })
    });

    const data = await response.json();
    const rawText = data.choices[0].message.content;
    
    document.getElementById("quizTopic").innerHTML = 
      `<h2 class="topic-heading">${topic}</h2>`;
    
    displayQuiz(rawText);

  } catch (error) {
    document.getElementById("quizContent").innerHTML =
      "<p style='color:red'>Error: " + error.message + "</p>";
  }
}

function displayQuiz(text) {
  // Reset active grading counters for the new instance layout
  totalQuestions = 0;
  correctAnswers = 0;
  answeredQuestions = 0;

  const lines = text.trim().split("\n").filter(l => l.trim() !== "");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.match(/^Q\d+\./)) {
      totalQuestions++;
      html += `<div class="question-block">`;
      html += `<h4>${line}</h4>`;
      i++;

      while (i < lines.length && lines[i].trim().match(/^[A-D]\)/)) {
        const option = lines[i].trim();
        const letter = option[0];
        html += `<div class="option" onclick="checkAnswer(this, '${letter}')">${option}</div>`;
        i++;
      }

      if (i < lines.length && lines[i].trim().startsWith("Answer:")) {
        const correct = lines[i].trim().split("Answer:")[1].trim()[0];
        html += `<div style="display:none" class="correct-answer">${correct}</div>`;
        i++;
      }

      html += `</div>`;
    } else {
      i++;
    }
  }

  // Inject the dynamic scoreboard analysis block card matching quiz.html nodes
  html += `
    <div class="accuracy-box" id="accuracyBox" style="display:none; margin-top: 30px;">
      <h3 class="accuracy-title">📊 Your Result</h3>
      <div class="accuracy-stats">
        <div class="accuracy-stat">
          <span class="accuracy-num" id="correctCount">0</span>
          <span class="accuracy-label">Correct</span>
        </div>
        <div class="accuracy-stat">
          <span class="accuracy-num" id="wrongCount">0</span>
          <span class="accuracy-label">Wrong</span>
        </div>
        <div class="accuracy-stat">
          <span class="accuracy-num" id="accuracyPercent">0%</span>
          <span class="accuracy-label">Accuracy</span>
        </div>
      </div>
      <div class="accuracy-bar">
        <div class="accuracy-fill" id="accuracyFill" style="width: 0%;"></div>
      </div>
      <p class="accuracy-msg" id="accuracyMsg"></p>
    </div>`;

  document.getElementById("quizContent").innerHTML = html;
}

function checkAnswer(el, selected) {
  const block = el.parentElement;
  const correctDiv = block.querySelector(".correct-answer");
  if (!correctDiv) return;

  const correct = correctDiv.textContent.trim();
  const options = block.querySelectorAll(".option");

  // Lock interaction elements and expose the correct selection immediately
  options.forEach(opt => {
    opt.onclick = null; // Disables clicking options again after locking selection
    if (opt.textContent.trim()[0] === correct) {
      opt.classList.add("correct");
    }
  });

  // Grade user choice context inputs
  if (selected === correct) {
    el.classList.add("correct");
    correctAnswers++;
  } else {
    el.classList.add("wrong");
  }

  answeredQuestions++;
  updateAccuracy();
}

function updateAccuracy() {
  const accuracyBox = document.getElementById("accuracyBox");
  const wrong = answeredQuestions - correctAnswers;
  const percent = Math.round((correctAnswers / answeredQuestions) * 100);

  // Ingest metric values straight onto tracking DOM nodes
  document.getElementById("correctCount").innerText = correctAnswers;
  document.getElementById("wrongCount").innerText = wrong;
  document.getElementById("accuracyPercent").innerText = percent + "%";
  
  const fill = document.getElementById("accuracyFill");
  fill.style.width = percent + "%";

  // Shift progress tracking accents based on user tier performance
  if (percent >= 80) {
    fill.style.background = "#28a745"; // Success Green
  } else if (percent >= 50) {
    fill.style.background = "#ffc107"; // Warning Amber
  } else {
    fill.style.background = "#dc3545"; // Alert Red
  }

  // Compile active summary strings on exam termination
  const msg = document.getElementById("accuracyMsg");
  if (answeredQuestions === totalQuestions) {
    if (percent >= 80) msg.innerText = "🎉 Excellent! You're well prepared!";
    else if (percent >= 60) msg.innerText = "👍 Good job! Keep practicing!";
    else if (percent >= 40) msg.innerText = "📚 Keep studying, you'll get there!";
    else msg.innerText = "💪 Don't give up! Review the topic again!";
  }

  accuracyBox.style.display = "block";
}