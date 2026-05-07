

# PDF Management System with Smart Notifications

A full-stack application built with the MERN stack (MongoDB, Express, React, Node.js) that enables efficient PDF file management, featuring real-time upload tracking and an intelligent notification system for bulk processing.

## 🚀 Key Features

### 1. Robust File Uploading
* **Drag-and-Drop/Selection**: Users can select single or multiple PDF files for upload.
* **Individual Progress Tracking**: Real-time progress bars for every file, displaying filename, size, and percentage completion using Axios `onUploadProgress`.
* **Type Validation**: Backend enforcement ensures only `application/pdf` files are accepted, with a 10MB size limit per file.

### 2. Smart Notification Logic
The system dynamically adjusts its behavior based on the volume of files being uploaded simultaneously:
* **Standard Upload ($\leq 3$ files)**: Provides standard inline progress indicators; once finished, the file list refreshes.
* **Bulk Upload ($> 3$ files)**: 
    * Immediately triggers a "Processing in background" state.
    * Backend returns a `202 Accepted` status while continuing to process metadata in the database.
    * Sends a real-time WebSocket notification once the entire batch is successfully processed.

### 3. Notification Center
* **Persistent Storage**: All notifications (success, error, info) are stored in MongoDB.
* **Header Integration**: A notification bell in the header displays a live unread count badge.
* **Management**: Users can view a sorted history of notifications and "Mark all as read" via a dedicated dropdown.

---

## 🏗️ Technical Architecture

### Backend (Node.js & Express)
* **File Handling**: Uses **Multer** for streaming files directly to disk storage. It automatically creates the `uploads/` directory if it does not exist.
* **Database**: **Mongoose** models define the structure for `File` metadata and `Notification` logs.
* **Real-time**: **Socket.io** is integrated directly into the HTTP server, allowing the backend to push completion events to the client immediately after database operations.

### Frontend (React & Vite)
* **State Management**: React `useState` and `useEffect` hooks manage the file list, upload queue, and notification states.
* **Global Listener**: A custom `useNotifications` hook initializes a single Socket.io connection at the application level. This ensures users receive notifications even if they navigate away from the upload page.
* **Styling**: Built with **Tailwind CSS** for a responsive and clean user interface.

---

## 🛠️ Installation and Setup

### Prerequisites
* Node.js (v18+)
* MongoDB Atlas or local instance

### 1. Backend Setup
1.  Navigate to `/backend`.
2.  Install dependencies: `npm install`.
3.  Configure your `.env` file:
    ```env
    PORT=5001
    MONGO_URI=your_mongodb_connection_string
    CLIENT_URL=http://localhost:5173
    ```
4.  Start the server: `node index.js`.

### 2. Frontend Setup
1.  Navigate to `/frontend`.
2.  Install dependencies: `npm install`.
3.  Configure your `.env` file:
    ```env
    VITE_API_URL=http://localhost:5001
    VITE_SOCKET_URL=http://localhost:5001
    ```
4.  Start the development server: `npm run dev`.

---

## 📝 Approach Details

### Asynchronous Bulk Processing
Instead of making the user wait for a long-running HTTP request when uploading many files, the backend immediately returns a `202 Accepted` response for batches larger than 3. This "fire-and-forget" approach on the frontend is complemented by a WebSocket listener that catches the `bulk_upload_complete` event when the backend confirms all database writes are finished.

### Data Persistence
Unlike systems that store alerts in `localStorage`, this approach ensures that a user can log in from any device and see their full notification history, as every alert is a first-class citizen in the MongoDB database.
