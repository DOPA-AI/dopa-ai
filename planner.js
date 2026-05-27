// Check immediately when page starts loading if user session cookie mock is true
if (localStorage.getItem("isLoggedIn") !== "true") {
  // If not logged in, violently boot them back to the verification screen
  window.location.href = "auth.html";
}

// Store selections
let selectedSubject = "";
let selectedCourse = "";
let selectedTopics = [];

// Course options
const courses = [
  { id: "class9", label: "Class 9", icon: "📗" },
  { id: "class10", label: "Class 10", icon: "📘" },
  { id: "class11", label: "Class 11", icon: "📙" },
  { id: "class12", label: "Class 12", icon: "📕" },
  { id: "jee", label: "JEE", icon: "🔬" },
  { id: "neet", label: "NEET", icon: "🩺" },
  { id: "engineering", label: "Engineering", icon: "⚙️" },
  { id: "bca", label: "BCA", icon: "💻" },
  { id: "bsc", label: "BSc", icon: "🧪" },
  { id: "upsc", label: "UPSC", icon: "🏛️" },
  { id: "ssc", label: "SSC", icon: "📋" },
  { id: "other", label: "Other", icon: "📚" },
];

// ── STEP 1 — LOAD COURSES ──
function loadCourses() {
  const subject = document.getElementById("subjectInput").value.trim();

  if (!subject) {
    alert("Please enter a subject first!");
    return;
  }

  selectedSubject = subject;

  // Build course grid
  let html = "";
  courses.forEach(course => {
    html += `
      <div class="course-card" onclick="selectCourse('${course.id}', '${course.label}', this)">
        <span class="course-icon">${course.icon}</span>
        <span class="course-label">${course.label}</span>
      </div>`;
  });

  document.getElementById("courseGrid").innerHTML = html;
  document.getElementById("step2").style.display = "block";

  // Scroll to step 2
  document.getElementById("step2").scrollIntoView({ behavior: "smooth" });
}

// ── STEP 2 — SELECT COURSE ──
async function selectCourse(courseId, courseLabel, el) {
  selectedCourse = courseLabel;

  // Highlight selected
  document.querySelectorAll(".course-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");

  // Show step 3
  document.getElementById("step3").style.display = "block";
  document.getElementById("topicsLoading").style.display = "block";
  document.getElementById("topicsGrid").innerHTML = "";

  // Scroll to step 3
  document.getElementById("step3").scrollIntoView({ behavior: "smooth" });

  // Generate topics with AI
  await generateTopics(selectedSubject, selectedCourse);
}

// ── GENERATE TOPICS WITH AI ──
async function generateTopics(subject, course) {
  try {
    // Secure backend routing channel hitting our internal Netlify serverless gateway
    const response = await fetch("/.netlify/functions/askGroq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a curriculum expert. Generate relevant topics for a subject and course level. Return ONLY a numbered list of topics, nothing else."
          },
          {
            role: "user",
            content: `List exactly 12 important topics for "${subject}" at "${course}" level.
            Format EXACTLY like this:
            1. Topic name
            2. Topic name
            3. Topic name
            Continue for all 12 topics.
            Only topic names, no descriptions, nothing else.`
          }
        ]
      })
    });

    const data = await response.json();
    const topicsText = data.choices[0].message.content;

    // Parse topics
    const lines = topicsText.split("\n").filter(l => l.trim() !== "");
    const topics = [];

    lines.forEach(line => {
      const cleaned = line.replace(/^\d+\.\s*/, "").replace(/\*\*/g, "").trim();
      if (cleaned) topics.push(cleaned);
    });

    displayTopics(topics);

  } catch (error) {
    document.getElementById("topicsGrid").innerHTML =
      `<p style="color:red">Error generating topics: ${error.message}</p>`;
  } finally {
    document.getElementById("topicsLoading").style.display = "none";
  }
}

// ── DISPLAY TOPICS AS CHECKBOXES ──
function displayTopics(topics) {
  let html = "";
  topics.forEach((topic, index) => {
    html += `
      <div class="topic-chip" id="chip${index}"
        onclick="toggleTopic('${topic.replace(/'/g, "\\'")}', ${index})">
        <span class="topic-check">☐</span>
        <span class="topic-text">${topic}</span>
      </div>`;
  });

  document.getElementById("topicsGrid").innerHTML = html;
}

// ── TOGGLE TOPIC SELECTION ──
function toggleTopic(topic, index) {
  const chip = document.getElementById(`chip${index}`);
  const check = chip.querySelector(".topic-check");

  if (chip.classList.contains("topic-selected")) {
    chip.classList.remove("topic-selected");
    check.innerText = "☐";
    selectedTopics = selectedTopics.filter(t => t !== topic);
  } else {
    chip.classList.add("topic-selected");
    check.innerText = "☑";
    selectedTopics.push(topic);
  }
}

// ── SELECT ALL TOPICS ──
function selectAllTopics() {
  selectedTopics = [];
  document.querySelectorAll(".topic-chip").forEach((chip, index) => {
    chip.classList.add("topic-selected");
    chip.querySelector(".topic-check").innerText = "☑";
    selectedTopics.push(chip.querySelector(".topic-text").innerText);
  });
}

// ── CLEAR ALL TOPICS ──
function clearAllTopics() {
  selectedTopics = [];
  document.querySelectorAll(".topic-chip").forEach(chip => {
    chip.classList.remove("topic-selected");
    chip.querySelector(".topic-check").innerText = "☐";
  });
}

// ── GO TO STEP 4 ──
function goToStep4() {
  if (selectedTopics.length === 0) {
    alert("Please select at least one topic!");
    return;
  }

  document.getElementById("step4").style.display = "block";
  document.getElementById("step4").scrollIntoView({ behavior: "smooth" });
}

// ── GENERATE PLAN ──
async function generatePlan() {
  const examDate = document.getElementById("examDate").value;
  const hours = document.getElementById("hoursInput").value;

  if (!examDate || !hours) {
    alert("Please fill exam date and study hours!");
    return;
  }

  const today = new Date();
  const exam = new Date(examDate);
  const daysLeft = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    alert("Please select a future date!");
    return;
  }

  document.getElementById("planBox").style.display = "block";
  document.getElementById("planContent").innerHTML =
    "<p style='color:#C77DFF'>Creating your personalized plan... ⏳</p>";

  document.getElementById("planBox").scrollIntoView({ behavior: "smooth" });

  try {
    // Secure backend routing channel hitting our internal Netlify serverless gateway
    const response = await fetch("/.netlify/functions/askGroq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are DOPA AI, a study planner. Create realistic detailed study plans. Always respond in English."
          },
          {
            role: "user",
            content: `Create a study plan for:
            - Subject: ${selectedSubject}
            - Course: ${selectedCourse}
            - Topics to cover: ${selectedTopics.join(", ")}
            - Days until exam: ${daysLeft} days
            - Study hours per day: ${hours} hours
            - Today: ${today.toDateString()}

            Format EXACTLY like this for every day:
            DAY 1 - [Full Date]
            Topic: [topic name]
            Time: [X hours]
            What to study: [brief description]
            ---
            DAY 2 - [Full Date]
            Topic: [topic name]
            Time: [X hours]
            What to study: [brief description]
            ---

            Distribute the selected topics evenly across all ${daysLeft} days.
            Follow this format strictly.`
          }
        ]
      })
    });

    const data = await response.json();
    const plan = data.choices[0].message.content;

    // Build HTML
    let html = "";
    html += `<h2 class="plan-subject-heading">${selectedSubject}</h2>`;
    html += `<p class="plan-meta">📚 ${selectedCourse} &nbsp;|&nbsp; 📅 ${daysLeft} days left &nbsp;|&nbsp; ⏰ ${hours} hrs/day</p>`;
    html += `<div class="plan-meta" style="margin-bottom:8px">📌 Topics: ${selectedTopics.join(" • ")}</div>`;
    html += `<div class="plan-divider"></div>`;

    const days = plan.split("---").filter(d => d.trim() !== "");

    days.forEach(day => {
      const lines = day.trim().split("\n").filter(l => l.trim() !== "");
      if (lines.length === 0) return;

      html += `<div class="day-block">`;
      lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.match(/^DAY \d+/i)) {
          html += `<h3 class="day-block-heading">${line}</h3>`;
        } else if (line.startsWith("Topic:")) {
          html += `<p class="day-topic"><strong>${line}</strong></p>`;
        } else if (line.startsWith("Time:")) {
          html += `<p class="day-time">⏰ ${line}</p>`;
        } else if (line.startsWith("What to study:")) {
          html += `<p class="day-content">📖 ${line}</p>`;
        } else {
          html += `<p class="day-content">${line}</p>`;
        }
      });
      html += `</div>`;
    });

    document.getElementById("planContent").innerHTML = html;

  } catch (error) {
    document.getElementById("planContent").innerHTML =
      `<p style="color:red">Error: ${error.message}</p>`;
  }
}