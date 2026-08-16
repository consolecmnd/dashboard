# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.16.6 create --template demo --no-types --add prettier eslint --install npm dashboard
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Deploying to a Synology NAS (Docker)

The app uses `@sveltejs/adapter-node` and ships with a `Dockerfile` and `docker-compose.yml` for running on your Synology DS224+ via Container Manager.

### Workflow

1. Develop locally, `git push` to GitHub.
2. On the NAS: `git pull` the changes.
3. Rebuild and restart the container (below).

### Build & run on the NAS

SSH into the NAS (or use the Container Manager terminal), then:

```sh
git clone git@github.com:consolecmnd/dashboard.git   # first time only
cd dashboard
git pull                                            # every update
docker compose up -d --build
```

The site is served at `http://<nas-ip>:3000`.

### First-time setup via Container Manager GUI

1. Open **Container Manager** → **Project** → **Create**.
2. Name it `dashboard`, set the path to the repo folder (`/volume1/docker/dashboard` or wherever you cloned it).
3. Point it at the `docker-compose.yml` in the repo (or paste its contents).
4. Select **Build the image** and click **Create**. Container Manager builds the image and starts the container.

### Manual image rebuild (alternative)

If you prefer not to clone the repo onto the NAS:

```sh
docker build -t dashboard:latest .
docker stop dashboard && docker rm dashboard
docker run -d --name dashboard --restart unless-stopped -p 3000:3000 dashboard:latest
```

### Updating after a code change

```sh
cd dashboard && git pull && docker compose up -d --build
```
