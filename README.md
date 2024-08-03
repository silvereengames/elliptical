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
node index.js
```

## Admin
Open with admin options by going to `localhost:3000/admin`

## Todo
- [ ] Re-do the css

- [ ] Ability to make public and private rooms

- [ ] Limit the amount of public and private rooms a user can create on the admin dashboard
