async function loadAssignments() {
  const container = document.getElementById("assignmentsContainer");
  const loading = document.getElementById("loadingAssignments");

  try {
    const res = await fetch("/api/assignments");
    const classes = await res.json();

    loading.style.display = "none";
    container.innerHTML = "";

    classes.forEach(cls => {
      let statusColor = "text-gray-500";

      if (cls.status === "Submitted") {
        statusColor = "text-green-600";
      }

      const dueDateHTML = cls.dueDate 
        ? `<div class="text-sm text-gray-500 mb-4">${cls.dueDate}</div>` 
        : "";

      container.innerHTML += `
        <div class="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition">
          <div class="text-xs font-semibold text-blue-600 mb-2">
            ${cls.className}
          </div>
          <div class="text-sm mb-2 ${statusColor}">
            ${cls.status}
          </div>
          <div class="font-semibold text-lg mb-3">
            ${cls.title}
          </div>
          ${dueDateHTML}
          <div class="flex gap-3 mt-4">
            <a href="${cls.link}" target="_blank">
              <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                View
              </button>
            </a>
            <button
              class="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1 rounded"
              data-course="${cls.courseId}"
              data-work="${cls.courseWorkId}"
              data-worktype="${cls.workType || 'ASSIGNMENT'}"
              onclick="aiFeedback(this)"
            >
              AI Feedback
            </button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading assignments:", err);
    loading.innerText = "Failed to load assignments";
  }
}

loadAssignments();

/* ---------------- AI FEEDBACK ---------------- */

async function aiFeedback(btn) {
  const courseId = btn.dataset.course;
  const courseWorkId = btn.dataset.work;
  const workType = btn.dataset.worktype || "ASSIGNMENT";

  console.log("Sending IDs:", courseId, courseWorkId, workType);

  const modal = document.getElementById("aiModal");
  const content = document.getElementById("aiContent");

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  content.innerText = "Analyzing assignment with AI...";

  try {
    const res = await fetch("/api/ai-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        courseId,
        courseWorkId,
        workType
      })
    });

    const data = await res.json();
    content.innerText = data.feedback;
  } catch (err) {
    console.error(err);
    content.innerText = "Failed to analyze assignment.";
  }
}

function closeModal() {
  const modal = document.getElementById("aiModal");
  modal.classList.remove("flex");
  modal.classList.add("hidden");
}