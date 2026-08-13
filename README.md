# 🎓 Examind AI

A comprehensive AI-powered examination and assessment platform built with a microservice-ready architecture.

---

## 👥 Team: Examind AI

* **Pratik Navale**
* **Prasad Mane**
* **Rushikesh Shinde**
* **Rajas Shah**
* **Anuj Shrivastava**

---

## 🏗 System Architecture

Examind AI consists of three core components running in parallel:

| Component | Tech Stack | Default Port | Directory |
| :--- | :--- | :---: | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS | `5173` | `frontend/` |
| **Backend Monolith** | Spring Boot 3.3.2, Java 17 | `5000` | `backend/` |
| **Payment Service** | Spring Boot 3.3.2, Java 17 | `5001` | `payment-service/` |

```
Examind AI/
├── 📁 backend/           # Core business logic & AI orchestration
├── 📁 payment-service/   # Isolated transaction & billing service
└── 📁 frontend/          # Modern React client application
```

---

## 🛠 Prerequisites

Ensure the following runtimes and tools are installed on your machine before setup:

* **Java**: JDK 17+
* **Build Tool**: Apache Maven 3.9+
* **Node Environment**: Node.js 18+ & `npm`
* **Database**: MySQL 8.0+ running on port `3306`
* **Version Control**: Git

### Verify Installation
```bash
java -version
mvn -version
node -v
npm -v
mysql --version
```

---

## 🚀 Quick Start Guide

### Step 1: Database Setup
Start your local MySQL server. Both Spring Boot services are configured to create their respective databases automatically on initial execution:
* **Backend Database:** `examind_ai`
* **Payment Service Database:** `examind_ai_payment`

Ensure MySQL has a user configured matching your environment credentials (default expected: `root` / `cdac`).

---

### Step 2: Environment Configuration

> ⚠️ **Security Warning:** Never commit real secrets, API keys, or database credentials to version control. Set these as environment variables in your operating system, IDE, or local shell session.

Set the required environment variables:

```bash
# Database Credentials
export DB_USERNAME=root
export DB_PASSWORD=your_mysql_password

# Authentication Secrets (Must match across backend and payment services)
export JWT_SECRET=your_long_random_jwt_secret_key
export INTERNAL_API_SECRET=your_internal_service_communication_secret

# SMTP Mailer Settings
export MAIL_USERNAME=your_email@gmail.com
export MAIL_PASSWORD=your_gmail_app_password

# OAuth2 Authentication
export GOOGLE_CLIENT_ID=your_google_oauth_client_id
export GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Media Storage
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_cloudinary_api_key
export CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI Engine Integrations
export GEMINI_API_KEY=your_gemini_api_key
export GROQ_API_KEY=your_groq_api_key

# Payment Gateway
export RAZORPAY_KEY_ID=your_razorpay_key_id
export RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

### Step 3: Service Startup

Execute each service in a separate terminal window:

#### 1️⃣ Start Backend Service
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
* **Base Endpoint:** `http://localhost:5000/api`

#### 2️⃣ Start Payment Service
```bash
cd payment-service
mvn clean install
mvn spring-boot:run
```
* **Base Endpoint:** `http://localhost:5001/api`

#### 3️⃣ Start Frontend Web App
```bash
cd frontend
npm install
```

Verify or create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

Launch development server:
```bash
npm run dev
```
* **Application Access:** `http://localhost:5173`

---

## 🔍 Verification & Diagnostics

Validate that all active instances are operational:

| Service | Health Check Endpoint | Target Status |
| :--- | :--- | :---: |
| **Frontend UI** | `http://localhost:5173` | `200 OK` |
| **Backend API** | `http://localhost:5000/api` | `200 OK` |
| **Payment Service** | `http://localhost:5001/api/actuator/health` | `{"status":"UP"}` |

---

## ❓ Troubleshooting

| Issue / Error | Primary Cause | Resolution |
| :--- | :--- | :--- |
| **Database Connection Failure** | MySQL service stopped or invalid credentials. | Verify MySQL service is active on `3306` and check `DB_USERNAME`/`DB_PASSWORD`. |
| **API Call Failures (CORS/404)** | Backend server off or misconfigured base URL. | Ensure Backend is live on port `5000` and `VITE_API_URL` is set correctly in `.env`. |
| **Transaction Errors** | Incorrect Razorpay credentials. | Verify `RAZORPAY_KEY_ID` and secret key match your sandbox/live environment. |
| **OAuth Login Failures** | Misconfigured Google redirect URI. | Add `http://localhost:5000/api/login/oauth2/code/google` to authorized URIs in Google Console. |
| **Mail Dispatch Failure** | Invalid Gmail credentials or missing App Password. | Generate a dedicated **App Password** via Google Security settings (2FA required). |
| **Inter-service 401/403 Errors** | Mismatched secret keys across services. | Ensure `JWT_SECRET` and `INTERNAL_API_SECRET` are identical in both backend services. |
