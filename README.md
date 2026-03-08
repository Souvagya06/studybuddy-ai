StudyBuddy.AI 📚🤖
StudyBuddy.AI is an AI-powered academic assistant that integrates with Google Classroom to help students understand assignments faster. It analyzes assignment materials using AI and provides structured feedback including summaries, key concepts, implementation guidance, and potential exam questions.

🚀 Features

🔐 Google Authentication
📚 Google Classroom Integration
📄 AI Assignment Analysis
⏱ Assignment Deadline Tracking
🤖 AI-powered Difficulty Detection
📊 Dashboard for Class & Assignment Overview
💬 AI Doubt Assistant with Chat History


🧠 How It Works

User logs in using Google OAuth
The app connects to Google Classroom API
Latest assignments are fetched
Assignment content is extracted and converted into text
Text is analyzed using Groq AI
AI returns:

Summary
Key Concepts
Implementation requirements
Topics to study
Possible exam questions




🏗 Architecture Overview
Google Classroom API
        │
        ▼
Assignment Content Fetch
        │
        ▼
Text Extraction & Processing
        │
        ▼
Groq AI Analysis
        │
        ▼
Student Dashboard Feedback

🛠 Tech Stack
Languages

JavaScript

Frontend

HTML5
Tailwind CSS

Backend

Node.js
Express.js

Database & AI

Turso Database
Groq AI (LLaMA 3.3 70B)

Tools

Git
GitHub
Postman
VS Code


📂 Project Structure
StudyBuddy-AI
│
├── backend
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── .env
│
├── frontend-dashboard/
│
├── public/
│   ├── dashboard.html
│   ├── assignments.html
│   └── styles.css
│
└── README.md

⚙️ Installation Guide
1️⃣ Clone the repository
git clone <repository-url>
2️⃣ Navigate to backend
cd backend
3️⃣ Install dependencies
npm install
4️⃣ Create .env file
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_turso_database_url
DATABASE_TOKEN=your_turso_database_token
SESSION_SECRET=your_session_secret
5️⃣ Run the server
node server.js
Server runs at:
http://localhost:5000

👨‍💻 Team Members
🧑‍💻 Souvagya Karmakar
Full Stack Developer (Backend & AI Systems Lead)
Responsible for system architecture, backend APIs, Google Classroom integration, and AI analysis pipeline.
🤖 Anirban Pal
AI API Integration Engineer
Handled integration with Groq AI and AI response processing.
🗄 Ronit Mishra
Database Engineer & Data Architect
Designed and implemented the Turso database and handled data persistence.
🎨 Sugata Nayak
Frontend Developer (HTML & UI/UX Lead)
Designed the UI components and user interface experience.
🖥 Supratik Patra
UI & Frontend Integration Engineer
Worked on frontend logic, API integration with UI, and dashboard interaction.

🎯 Future Improvements

Smart assignment reminders
AI study roadmap generation
Collaborative study groups
Mobile responsive improvements
Support for more assignment attachment types


📜 License
This project was developed for academic and hackathon purposes.

⭐ Acknowledgements

Google Classroom API
Groq AI
Node.js ecosystem
Turso Database

