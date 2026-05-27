// Check immediately when page starts loading if user session cookie mock is true
if (localStorage.getItem("isLoggedIn") !== "true") {
  // If not logged in, violently boot them back to the verification screen
  window.location.href = "auth.html";
}

async function findResources() {
  const topic = document.getElementById("resourceInput").value;

  if (!topic) {
    alert("Please enter a topic first!");
    return;
  }

  document.getElementById("resourceContent").innerHTML =
    "<p style='color:#C77DFF'>Finding best resources... ⏳</p>";

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
            content: "You are DOPA AI, a resource finder for students. Suggest the best free learning resources. Always format exactly as instructed."
          },
          {
            role: "user",
            content: `Suggest the best free learning resources for a student studying "${topic}".

            Format EXACTLY like this:

            YOUTUBE:
            1. Channel Name | Video Title
            2. Channel Name | Video Title
            3. Channel Name | Video Title

            WEBSITES:
            1. Website Name | What it offers
            2. Website Name | What it offers

            TIPS:
            1. Study tip one
            2. Study tip two

            Follow this format strictly. Nothing else.`
          }
        ]
      })
    });

    const data = await response.json();
    const resources = data.choices[0].message.content;

    displayResources(resources, topic);

  } catch (error) {
    document.getElementById("resourceContent").innerHTML =
      "<p style='color:red'>Error: " + error.message + "</p>";
  }
}

function displayResources(text, topic) {
  const lines = text.trim().split("\n").filter(l => l.trim() !== "");
  let html = "";

  // Topic heading
  html += `<h2 class="topic-heading">${topic}</h2>`;

  let currentSection = "";

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    // Section headings
    if (line.startsWith("YOUTUBE:")) {
      html += `<div class="resource-section">`;
      html += `<h3 class="resource-section-title">🎬 YouTube Videos</h3>`;
      currentSection = "youtube";

    } else if (line.startsWith("WEBSITES:")) {
      html += `</div><div class="resource-section">`;
      html += `<h3 class="resource-section-title">🌐 Free Websites & Courses</h3>`;
      currentSection = "websites";

    } else if (line.startsWith("TIPS:")) {
      html += `</div><div class="resource-section">`;
      html += `<h3 class="resource-section-title">💡 Study Tips</h3>`;
      currentSection = "tips";

    } else if (line.match(/^\d+\./)) {
      // Remove number prefix
      const content = line.replace(/^\d+\.\s*/, "").trim();

      if (currentSection === "youtube") {
        // Split by | to get channel and title
        const parts = content.split("|");
        const channel = parts[0] ? parts[0].trim() : content;
        const title = parts[1] ? parts[1].trim() : "";

        // Create YouTube search URL
        const searchQuery = encodeURIComponent(topic + " " + channel);
        const youtubeURL = `https://www.youtube.com/results?search_query=${searchQuery}`;

        html += `
          <div class="youtube-card">
            <div class="youtube-info">
              <span class="youtube-channel">📺 ${channel}</span>
              <span class="youtube-title">${title}</span>
            </div>
            <a href="${youtubeURL}" target="_blank" class="youtube-btn">
              Watch →
            </a>
          </div>`;

      } else if (currentSection === "websites") {
        const parts = content.split("|");
        const site = parts[0] ? parts[0].trim() : content;
        const desc = parts[1] ? parts[1].trim() : "";

        // Create Google search URL for the website
        const searchURL = `https://www.google.com/search?q=${encodeURIComponent(site + " " + topic)}`;

        html += `
          <div class="website-card">
            <div class="website-info">
              <span class="website-name">🌐 ${site}</span>
              <span class="website-desc">${desc}</span>
            </div>
            <a href="${searchURL}" target="_blank" class="website-btn">
              Visit →
            </a>
          </div>`;

      } else if (currentSection === "tips") {
        html += `<div class="tip-card">💡 ${content}</div>`;
      }
    }
  });

  html += `</div>`;
  document.getElementById("resourceContent").innerHTML = html;
}