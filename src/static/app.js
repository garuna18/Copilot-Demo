document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Kleine helper om tekst veilig in HTML te plaatsen
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants ? details.participants.length : 0);

        // Bouw deelnemers-sectie: lijst zonder bullets en met een delete-knop per deelnemer
        let participantsHtml;
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          participantsHtml = `<ul class="participants-list">` +
            details.participants
              .map((p) =>
                `<li class="participant-item">
                   <span class="participant-email">${escapeHtml(p)}</span>
                   <button class="delete-btn" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" aria-label="Unregister">✖</button>
                 </li>`
              )
              .join("") +
            `</ul>`;
        } else {
          participantsHtml = `<p class="no-participants">Nog geen deelnemers</p>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p class="activity-desc">${escapeHtml(details.description)}</p>
          <p><strong>Schema:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Beschikbaarheid:</strong> ${spotsLeft} plekken over</p>
          <div class="participants-section">
            <strong>Deelnemers</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities list after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegated click handler for delete buttons on participant items
  activitiesList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target.classList.contains("delete-btn")) return;

    const activity = target.dataset.activity;
    const email = target.dataset.email;

    if (!activity || !email) return;

    if (!confirm(`Verwijder ${email} van ${activity}?`)) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        messageDiv.textContent = result.message || "Deelnemer verwijderd";
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");

        // Refresh list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Kon deelnemer niet verwijderen";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }

      // Hide message after a few seconds
      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
    } catch (err) {
      console.error("Error removing participant:", err);
      messageDiv.textContent = "Fout bij verwijderen. Probeer het opnieuw.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
    }
  });

  // Initialize app
  fetchActivities();
});
