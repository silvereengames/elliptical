# elliptical
The most simple socket.io web-based live chatting platform with simple moderation features

## Setup
### Docker: (Recommended)
**Prerequisites:**
- [Docker](https://docs.docker.com/engine/install/)
### Start
```
git clone https://github.com/silvereengames/elliptical.git
cd elliptical
sudo docker compose up -d
```
### Terminal:
**Prerequisites:**
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community-edition)
### Start
```
git clone https://github.com/silvereengames/elliptical.git
cd elliptical
npm install
npm run build
node index.js
```

## Admin
Open with admin options by going to `localhost:3000/admin`

## Todo
- [x] Re-do the css
- [x] Re-do the admin panel
- [ ] Ability to make public and private rooms
