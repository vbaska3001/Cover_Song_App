## 🎵 Cover Song Validator App

The Cover Song Validator App is a Node.js–based application designed to help identify and validate whether a given song is a genuine cover of an original track.

The application enforces a strict validation logic to ensure accuracy and consistency in judgement.

The app is containerized with Docker, built using Jenkins, and runs on port 3000. Dockerfile is added in this repo for reference.

---

## 🚀 Tech Stack

- Node.js
- JavaScript
- NPM
- Docker
- Jenkins (CI)
- GitHub

---

## 🔁 CI/CD with Jenkins
- Jenkins pulls the code from GitHub. Clone: https://github.com/vbaska3001/Cover_Song_App.git
- Builds the Docker image using the Dockerfile.

  Commands:
  ```
  docker build -t node_app .
  docker run -d --name cover_song-app -p 3000:3000 node_app
  ```
- Runs the container on port 3000. Web Browser: http://HostIP:3000/
- App is accessible locally after successful build.

## ⚙️ Local Setup (Without Docker)
```
npm install
node server.js
```
**Access the app at:** http://localhost:3000
## 🐳 Docker Setup
**Build Docker Image**
```
docker build -t cover_song_app .
```
**Run Container**
```
docker run -d -p 3000:3000 cover_song_app
```
**Access the app at:** http://localhost:3000

---

## Reference Images:
<img width="700" height="500" alt="Screenshot 2026-01-02 at 9 19 27 AM" src="https://github.com/user-attachments/assets/676745e8-1b34-4bde-a34c-c2bc3e766076" />
<img width="700" height="500" alt="Screenshot 2026-01-02 at 9 20 16 AM" src="https://github.com/user-attachments/assets/93c5cf9d-27de-4889-8135-da68b8e65470" />
<img width="700" height="500" alt="Screenshot 2026-01-02 at 9 19 51 AM" src="https://github.com/user-attachments/assets/374780ac-52a8-41fd-adf7-ddd46a59761d" />

## Notes
- This project is part of my DevOps learning journey and showcases Docker image creation, Container orchestration and app deployment using Docker image.
- Jenkins is used to automate te build process and this github repository can be used for reference.
- Make sure to replicate the files in test space and test it before deployment as this is just a demo setup for learning purpose only.
