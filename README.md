# StudyBuddy.AI 📚🤖

StudyBuddy.AI is an AI-powered academic assistant that integrates with **Google Classroom** to help students understand assignments faster.
It analyzes assignment materials (PDF/PPT) using **AI** and provides structured feedback including summaries, key concepts, implementation guidance, and potential exam questions.

---

# 🚀 Features

* 🔐 **Google Authentication**
* 📚 **Google Classroom Integration**
* 📄 **AI Assignment Analysis**
* ⏱ **Assignment Deadline Tracking**
* 📂 **Student File Upload System**
* 🤖 **AI-powered Difficulty Detection**
* 📊 **Dashboard for Class & Assignment Overview**

---

# 🧠 How It Works

1. User logs in using **Google OAuth**
2. The app connects to **Google Classroom API**
3. Latest assignments are fetched
4. Assignment attachments are downloaded from **Google Drive**
5. Files (PDF/PPT) are parsed and converted into text
6. Text is analyzed using **OpenRouter AI**
7. AI returns:

   * Summary
   * Key Concepts
   * Implementation requirements
   * Topics to study
   * Possible exam questions

---

# 🏗 Architecture Overview

```
Google Classroom API
        │
        ▼
Google Drive File Fetch
        │
        ▼
PDF / PPT Text Extraction
        │
        ▼
OpenRouter AI Analysis
        │
        ▼
Student Dashboard Feedback
```

---

# 🛠 Tech Stack

### Languages

* JavaScript

### Frontend

* HTML5
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database & AI

* Turso Database
* OpenRouter AI API

### Tools

* Git
* GitHub
* Postman
* VS Code

---

# 📂 Project Structure

```
StudyBuddy-AI
│
├── backend
│   ├── server.js
│   ├── uploads/
│   └── .env
│
├── public
│   ├── dashboard.html
│   ├── assignments.html
│   ├── assignment.js
│   └── styles.css
│
└── README.md
```

---

# ⚙️ Installation Guide

### 1️⃣ Clone the repository

```
git clone <repository-url>
```

---

### 2️⃣ Navigate to backend

```
cd backend
```

---

### 3️⃣ Install dependencies

```
npm install express axios dotenv multer express-session googleapis @libsql/client pdfjs-dist pptx2json
```

---

### 4️⃣ Create `.env` file

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

OPENROUTER_API_KEY=your_openrouter_api_key

DATABASE_URL=your_turso_database_url
DATABASE_TOKEN=your_turso_database_token
```

---

### 5️⃣ Run the server

```
node server.js
```

Server runs at:

```
http://localhost:5000
```

---

# 👨‍💻 Team Members

### 🧑‍💻 Souvagya Karmakar

**Full Stack Developer (Backend & AI Systems Lead)**
Responsible for system architecture, backend APIs, Google Classroom integration, and AI analysis pipeline.

---

### 🤖 Anirban Pal

**AI API Integration Engineer**
Handled integration with OpenRouter AI and AI response processing.

---

### 🗄 Ronit Mishra

**Database Engineer & Data Architect**
Designed and implemented the Turso database and handled data persistence.

---

### 🎨 Sugata Nayak

**Frontend Developer (HTML & UI/UX Lead)**
Designed the UI components and user interface experience.

---

### 🖥 Supratik Patra

**UI & Frontend Integration Engineer**
Worked on frontend logic, API integration with UI, and dashboard interaction.

---

# 🎯 Future Improvements

* Support for **Google Docs & Slides attachments**
* Smart **assignment reminders**
* AI **study roadmap generation**
* Collaborative **study groups**
* Mobile responsive improvements

---

# 📜 License

This project was developed for **academic and hackathon purposes**.

---

# ⭐ Acknowledgements

* Google Classroom API
* OpenRouter AI
* Node.js ecosystem
* Turso Database
