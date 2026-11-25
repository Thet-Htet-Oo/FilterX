# FilterX 

FilterX is a full-stack social learning platform designed to provide a space where users can share knowledge, interact with others, and participate in a safer online community.

The platform allows users to create posts, share images and files, comment, reply, like content, and receive notifications. Its main feature is an AI-powered content moderation system that detects inappropriate and toxic content using a combination of text-processing rules, Google's Gemini API, and Machine Learning.

## Project Architecture

FilterX consists of three independently runnable services:

- **Frontend:** React 19 + Vite
- **Backend:** Java Spring Boot 3.2 + MySQL + Spring Data JPA
- **AI Moderation Service:** Python + Flask + Google Gemini API + Scikit-learn

## Main Features

### 1. User Authentication and Profile Management

- User registration and login.
- Password hashing using BCrypt.
- Authentication state management using React Context API.
- Persistent login state using localStorage.
- Backend user verification when the application starts.
- Password strength and confirmation validation.
- International phone number validation using Google's libphonenumber.
- Profile viewing and editing.

### 2. Social Feed and Content Management

- Create, edit, and delete posts.
- Organize posts using categories.
- Share text, up to 3 photos, and up to 3 files per post.
- Comment and reply to posts.
- Like and unlike posts, comments, and replies.
- Category-based post filtering.
- Content ownership validation to prevent unauthorized modifications.

### 3. File and Image Management

- Upload photos and documents.
- Validate file extensions, MIME types, and file sizes.
- Block potentially dangerous executable files.
- Store attachments in MySQL using BLOB storage.
- View supported images and PDF files directly.
- Download other supported attachments.

### 4. Notification System

- Receive notifications when other users like posts, comments, or replies.
- Receive notifications when other users comment or reply.
- Display unread notification counts.
- Periodically check unread notifications every 30 seconds.
- Navigate directly to the related post or comment when clicking a notification.

### 5. AI-Powered Content Moderation

One of the main features of FilterX is its hybrid AI content moderation system.

The system checks posts, comments, and replies before they are saved to the database.

It uses a four-stage moderation pipeline:

1. **Text Normalization:** Cleans text, converts common leetspeak characters, and preserves Myanmar Unicode characters.
2. **Deterministic Rules:** Detects clearly inappropriate words and phrases using predefined rules.
3. **Context-Aware AI Detection:** Uses Google's Gemini API to understand sentence context and distinguish harmful language from harmless expressions, idioms, and names.
4. **Machine Learning Fallback:** Uses Scikit-learn's CountVectorizer and Logistic Regression model when the Gemini service is unavailable or returns an invalid response.

The system also includes fallback moderation rules in the Spring Boot backend to maintain basic content moderation when the Python service cannot be reached.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, Vite |
| UI | Bootstrap 5, Bootstrap Icons |
| Backend | Java 17, Spring Boot 3.2 |
| Database | MySQL |
| ORM | Spring Data JPA / Hibernate |
| Authentication | BCrypt, React Context API |
| AI Service | Python, Flask |
| AI Integration | Google Gemini API |
| Machine Learning | Scikit-learn |
| Data Processing | Pandas, CountVectorizer |
| API Communication | REST API |
| Version Control | Git, GitHub |

## Technical Challenges and Solutions

During development, I encountered several technical challenges:

- **False-Positive Content Detection:** Improved moderation by considering sentence context instead of relying only on keyword matching.
- **AI Service Reliability:** Implemented timeout configurations and fallback mechanisms to handle unavailable AI services.
- **Multi-Service Integration:** Connected React, Spring Boot, and Flask through REST APIs and configured cross-origin communication.
- **File Upload Security:** Implemented validation on both frontend and backend to prevent unsafe file uploads.
- **Database Relationships:** Managed relationships between posts, comments, replies, likes, and attachments while maintaining data consistency.
- **Notification Navigation:** Implemented navigation and content highlighting while handling asynchronously loaded posts.

## Project Structure

The project is organized into three main parts:

```text
FilterX/
│
├── frontend/       # React + Vite application
│
├── backend/        # Spring Boot REST API
│
└── ai/             # Python Flask AI moderation service
    ├── comment_api.py
    ├── train_model.py
    ├── comments.csv
    └── requirements.txt
```

## Running the Project

Each service runs independently and must be configured before starting the application.

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Make sure MySQL is running and the database connection is configured in `application.properties`.

### 3. AI Moderation Service

```bash
cd ai
pip install -r requirements.txt
python comment_api.py
```

Configure your Gemini API key before starting the AI service.

## Future Improvements

- Improve the machine learning model with a larger and more diverse training dataset.
- Enhance moderation accuracy for different languages and contexts.
- Improve notification delivery and real-time updates.
- Strengthen authentication and session security.
- Optimize file storage and application performance.

## Learning Outcomes

Through developing FilterX, I gained practical experience in:

- Full-stack web application development.
- REST API design and integration.
- Database design and management.
- Authentication and password security.
- React state management.
- Java Spring Boot backend development.
- Python-based AI and Machine Learning integration.
- Multi-service application architecture.
- Debugging, testing, and problem-solving.

## Project Purpose

FilterX was developed as a collaborative learning project to improve our technical skills and gain practical experience in building a full-stack application. It demonstrates how frontend development, backend engineering, database management, and AI technologies can work together to solve real-world problems.
