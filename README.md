# Elliptical

The most simple socket.io web-based live chatting platform with simple moderation features

## Setup

### Docker: (Recommended)

**Prerequisites:**

- [Docker](https://docs.docker.com/engine/install/)

### Start

```bash
git clone https://github.com/silvereengames/elliptical.git
cd elliptical
sudo docker compose up -d
```

### Terminal:

**Prerequisites:**

- [pnpm](https://pnpm.io/) or any package manager of your choice
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community-edition)

### Start

```bash
git clone https://github.com/silvereengames/elliptical.git
cd elliptical
# We recommend using pnpm, but you can use npm or bun
pnpm install
pnpm start
```

### Development

To start the development server, run:

```bash
pnpm install
pnpm run start:dev
```

This will start both the Vite development server and your backend server concurrently. This allows fast updates to the front end for easy testing while keeping the backend server running.

## Admin

Open with admin options by going to `localhost:3000/admin`

## Todo

- [x] Re-do the css
- [x] Re-do the admin panel
- [ ] Notification sounds
- [ ] Mute button for notification sounds
- [ ] Ability to make public and private rooms