// Check immediately when page starts loading if user session cookie mock is true
if (localStorage.getItem("isLoggedIn") !== "true") {
  // If not logged in, violently boot them back to the verification screen
  window.location.href = "auth.html";
}

// API Key
const GROQ_API_KEY = localStorage.getItem("groq_api_key") || "DEVELOPMENT_KEY_PLACEHOLDER";

// Store generated content
let generatedContent = {
  notes: "",
  quiz: "",
  assignment: ""
};

// Accuracy tracking
let ytTotal = 0;
let ytCorrect = 0;
let ytAnswered = 0;

// URL timer
let urlTimer = null;

// Store video title
window.ytVideoTitle = "";

// ── HANDLE URL INPUT ──
function handleURLInput(value) {
  clearTimeout(urlTimer);
  if (value.includes("youtube.com") || value.includes("youtu.be")) {
    document.getElementById("autoFillMsg").innerHTML =
      "<p class='autofill-loading'>🔍 Reading video info...</p>";
    urlTimer = setTimeout(() => {
      showVideoPreview(value);
    }, 800);
  }
}

// ── SHOW VIDEO PREVIEW ──
async function showVideoPreview(url) {
  if (!url) return;

  let videoId = "";

  if (url.includes("watch?v=")) {
    videoId = url.split("watch?v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  }

  if (videoId) {
    document.getElementById("videoFrame").src =
      `https://www.youtube.com/embed/${videoId}`;
    document.getElementById("videoPreview").style.display = "block";

    try {
      const oembedURL = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedURL);
      const data = await response.json();

      if (data.title) {
        window.ytVideoTitle = data.title;
        document.getElementById("autoFillMsg").innerHTML =
          "<p class='autofill-success'>✅ Video detected: " + data.title + "</p>";
        setTimeout(() => {
          document.getElementById("autoFillMsg").innerHTML = "";
        }, 3000);
      }
    } catch (error) {
      document.getElementById("autoFillMsg").innerHTML = "";
      console.log("Could not auto-fill:", error);
    }
  }
}

// ── GENERATE CONTENT ──
async function generateContent() {
  const ytURL = document.getElementById("ytURL").value.trim();

  if (!ytURL) {
    alert("Please paste a YouTube URL first!");
    return;
  }

  // Use auto detected video title or URL as topic
  const ytTopic = window.ytVideoTitle || ytURL;
  const ytClass = "";

  // Show video if not already shown
  if (document.getElementById("videoPreview").style.display === "none") {
    showVideoPreview(ytURL);
  }

  // Show loading in all tabs
  document.getElementById("notesContent").innerHTML =
    "<p style='color:#C77DFF'>Generating notes... ⏳</p>";
  document.getElementById("quizContent").innerHTML =
    "<p style='color:#C77DFF'>Generating quiz... ⏳</p>";
  document.getElementById("assignmentContent").innerHTML =
    "<p style='color:#C77DFF'>Generating assignment... ⏳</p>";

  // Show tabs
  document.getElementById("ytTabs").style.display = "flex";
  document.getElementById("notesContent").style.display = "block";
  document.getElementById("quizContent").style.display = "none";
  document.getElementById("assignmentContent").style.display = "none";

  // Generate all 3 simultaneously
  try {
    const [notes, quiz, assignment] = await Promise.all([
      generateNotes(ytTopic, ytClass),
      generateQuizContent(ytTopic, ytClass),
      generateAssignment(ytTopic, ytClass)
    ]);

    generatedContent.notes = notes;
    generatedContent.quiz = quiz;
    generatedContent.assignment = assignment;

    displayNotes(notes, ytTopic);
    displayQuiz(quiz);
    displayAssignment(assignment, ytTopic);

  } catch (error) {
    document.getElementById("notesContent").innerHTML =
      "<p style='color:red'>Error: " + error.message + "</p>";
  }
}

// ── GENERATE NOTES ──
async function generateNotes(topic, level) {
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
          content: "You are DOPA AI, a study notes generator. Always respond in English only, regardless of the topic language. Create clear, organized study notes for students."
        },
        {
          role: "user",
          content: `IMPORTANT: Respond in ENGLISH ONLY. Do not use any other language.
           Create detailed study notes in English for a student on the topic: "${topic}"

           Format EXACTLY like this:

           OVERVIEW:
           [2-3 sentence summary]

           KEY POINTS:
           POINT: [Point name]
           [explanation]

           POINT: [Point name]
           [explanation]

           IMPORTANT TERMS:
           TERM: [term] - [definition]
           TERM: [term] - [definition]

           SUMMARY:
           [3-4 key takeaways]`
        }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// ── GENERATE QUIZ CONTENT ──
async function generateQuizContent(topic, level) {
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
          content: "You are DOPA AI, a quiz generator for students. Always respond in English only, regardless of the topic language. Generate exactly 20 MCQ questions."
        },
        {
          role: "user",
          content: `IMPORTANT: Respond in ENGLISH ONLY. Do not use any other language.
        Create exactly 20 MCQ questions in English about "${topic}".
          Format EXACTLY like this:
          Q1. Question here?
          A) Option one
          B) Option two
          C) Option three
          D) Option four
          Answer: A

          Do this for all 20 questions. Nothing else.`
        }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// ── GENERATE ASSIGNMENT ──
async function generateAssignment(topic, level) {
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
          content: "You are DOPA AI, an assignment generator for students. Always respond in English only, regardless of the topic language. Create practical and educational assignments."
        },
        {
          role: "user",
          content: `IMPORTANT: Respond in ENGLISH ONLY. Do not use any other language.
      Create a complete assignment in English for a student on the topic: "${topic}"
          Format EXACTLY like this:

          TITLE: [Assignment Title]

          OBJECTIVE:
          [What student will learn]

          SHORT QUESTIONS: (Answer in 2-3 lines)
          Q1. [question]
          Q2. [question]
          Q3. [question]

          LONG QUESTIONS: (Answer in detail)
          Q1. [question]
          Q2. [question]

          PRACTICAL TASK:
          [A hands-on activity or experiment related to topic]

          SUBMISSION NOTE:
          [Instructions for submission]`
        }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// ── DISPLAY NOTES ──
function displayNotes(text, topic) {
  const lines = text.split("\n").filter(l => l.trim() !== "");
  let html = `<h2 class="topic-heading">📝 Notes</h2>`;

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    if (line.match(/^[=\-]{3,}$/)) return;
    if (line === topic) return;

    if (line.startsWith("OVERVIEW:") ||
        line.startsWith("KEY POINTS:") ||
        line.startsWith("IMPORTANT TERMS:") ||
        line.startsWith("SUMMARY:")) {
      const t = line.replace(":", "").replace(/\*\*/g, "").trim();
      html += `<h3 class="notes-section">${t}</h3>`;

    } else if (line.startsWith("POINT:")) {
      const t = line.replace("POINT:", "").replace(/\*\*/g, "").trim();
      html += `<h4 class="notes-point">📌 ${t}</h4>`;

    } else if (line.startsWith("TERM:")) {
      const t = line.replace("TERM:", "").replace(/\*\*/g, "").trim();
      const parts = t.split("-");
      html += `<p class="notes-term"><strong>${parts[0].trim()}</strong>${parts[1] ? " — " + parts[1].trim() : ""}</p>`;

    } else if (line.match(/^#{1,6}\s*/)) {
      const t = line.replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "").trim();
      html += `<h3 class="notes-section">${t}</h3>`;

    } else if (line.match(/^\*\*(.*?)\*\*/)) {
      const t = line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/^:\s*/, "").trim();
      html += `<h4 class="notes-point">📌 ${t}</h4>`;

    } else {
      const t = line
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/^[-•]\s*/, "")
        .trim();
      if (t) html += `<p class="notes-content">${t}</p>`;
    }
  });

  document.getElementById("notesContent").innerHTML = html;
}

// ── DISPLAY QUIZ ──
function displayQuiz(text) {
  ytTotal = 0;
  ytCorrect = 0;
  ytAnswered = 0;

  const lines = text.trim().split("\n").filter(l => l.trim() !== "");
  let html = `<h2 class="topic-heading">❓ Quiz</h2>`;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.match(/^Q\d+\./)) {
      ytTotal++;
      html += `<div class="question-block">`;
      html += `<h4 class="yt-question">${line}</h4>`;
      i++;

      while (i < lines.length && lines[i].trim().match(/^[A-D]\)/)) {
        const option = lines[i].trim();
        const letter = option[0];
        html += `<div class="option" onclick="checkYTAnswer(this, '${letter}')">${option}</div>`;
        i++;
      }

      // FIXED: Class named corrected to 'correct-answer' matching query selectors
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

  // Scoreboard configuration template string container block
  html += `
    <div class="accuracy-box" id="ytAccuracyBox" style="display:none; margin-top:30px;">
      <h3 class="accuracy-title">📊 Your Result</h3>
      <div class="accuracy-stats">
        <div class="accuracy-stat">
          <span class="accuracy-num" id="ytCorrectCount">0</span>
          <span class="accuracy-label">Correct</span>
        </div>
        <div class="accuracy-stat">
          <span class="accuracy-num" id="ytWrongCount">0</span>
          <span class="accuracy-label">Wrong</span>
        </div>
        <div class="accuracy-stat">
          <span class="accuracy-num" id="ytAccuracyPercent">0%</span>
          <span class="accuracy-label">Accuracy</span>
        </div>
      </div>
      <div class="accuracy-bar">
        <div class="accuracy-fill" id="ytAccuracyFill" style="width: 0%;"></div>
      </div>
      <p class="accuracy-msg" id="ytAccuracyMsg"></p>
    </div>`;

  document.getElementById("quizContent").innerHTML = html;
}

// ── DISPLAY ASSIGNMENT ──
function displayAssignment(text, topic) {
  const lines = text.split("\n").filter(l => l.trim() !== "");
  let html = `<h2 class="topic-heading">📋 Assignment</h2>`;

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    if (line.startsWith("TITLE:")) {
      const text = line.replace("TITLE:", "").replace(/\*\*/g, "").trim();
      html += `<h3 class="assignment-title">${text}</h3>`;

    } else if (line.startsWith("OBJECTIVE:") ||
               line.startsWith("SHORT QUESTIONS:") ||
               line.startsWith("LONG QUESTIONS:") ||
               line.startsWith("PRACTICAL TASK:") ||
               line.startsWith("SUBMISSION NOTE:")) {
      const text = line.replace(":", "").replace(/\*\*/g, "");
      html += `<h3 class="assignment-section">${text}</h3>`;

    } else if (line.match(/^Q\d+\./)) {
      const text = line.replace(/\*\*/g, "");
      html += `<p class="assignment-question">${text}</p>`;

    } else {
      const text = line.replace(/\*\*/g, "").replace(/\*/g, "").trim();
      if (text) html += `<p class="assignment-content">${text}</p>`;
    }
  });

  document.getElementById("assignmentContent").innerHTML = html;
}

// ── SWITCH TABS ──
function switchTab(tab, btn) {
  document.getElementById("notesContent").style.display = "none";
  document.getElementById("quizContent").style.display = "none";
  document.getElementById("assignmentContent").style.display = "none";

  document.querySelectorAll(".yt-tab").forEach(b => b.classList.remove("active"));

  document.getElementById(tab + "Content").style.display = "block";
  btn.classList.add("active");
}

// ── CHECK QUIZ ANSWER ──
function checkYTAnswer(el, selected) {
  const block = el.parentElement;
  const correctDiv = block.querySelector(".correct-answer");
  if (!correctDiv) return;

  const correct = correctDiv.textContent.trim();
  const options = block.querySelectorAll(".option");

  options.forEach(opt => {
    opt.onclick = null;
    if (opt.textContent.trim()[0] === correct) {
      opt.classList.add("correct");
    }
  });

  if (selected === correct) {
    el.classList.add("correct");
    ytCorrect++;
  } else {
    el.classList.add("wrong");
  }

  ytAnswered++;
  updateYTAccuracy();
}

// ── UPDATE ACCURACY ──
function updateYTAccuracy() {
  const accuracyBox = document.getElementById("ytAccuracyBox");
  const wrong = ytAnswered - ytCorrect;
  const percent = Math.round((ytCorrect / ytAnswered) * 100);

  // FIXED: Sync data values straight onto template card indicator selectors
  document.getElementById("ytCorrectCount").innerText = ytCorrect;
  document.getElementById("ytWrongCount").innerText = wrong;
  document.getElementById("ytAccuracyPercent").innerText = percent + "%";
  
  const fill = document.getElementById("ytAccuracyFill");
  fill.style.width = percent + "%";

  if (percent >= 80) fill.style.background = "#28a745";
  else if (percent >= 50) fill.style.background = "#ffc107";
  else fill.style.background = "#dc3545";

  const msg = document.getElementById("ytAccuracyMsg");
  if (ytAnswered === ytTotal) {
    if (percent >= 80) msg.innerText = "🎉 Excellent! You understood the video well!";
    else if (percent >= 60) msg.innerText = "👍 Good job! Watch the video again!";
    else if (percent >= 40) msg.innerText = "📚 Review the video once more!";
    else msg.innerText = "💪 Watch the full video carefully and retry!";
  }

  accuracyBox.style.display = "block";
}