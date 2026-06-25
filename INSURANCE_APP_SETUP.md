# Insurance Quotes App Setup

This file records the initial setup of the new Power Apps Code App project in `C:\AI-Insuarance-App`.

## Current Status

The app has been:

- initialized as a Vite + React + TypeScript app
- connected to the Power Apps environment
- pushed to the target Power Apps solution successfully

## Power Apps Environment

- Environment Name: `Anees Ur Rehman`
- Environment ID: `75dd5fe2-be00-e8ef-b643-353c3cdd9ac7`
- Solution Name: `Insurance Quotes`
- Solution ID: `27da6077-5118-f111-8342-7ced8da0b39a`

## Created Code App

- App Display Name: `Insurance Quotes`
- App ID: `e5302b13-a5de-4b24-8e55-59ee074af302`

## Local Project Structure

The project was started as a standard Vite app with:

- `React`
- `TypeScript`
- `Vite`
- `@microsoft/power-apps`

Important local files:

- `package.json`
- `vite.config.ts`
- `tsconfig.app.json`
- `src/App.tsx`
- `power.config.json`

## Verified Commands Used

These are the commands that worked during setup:

```bash
npm install
npx power-apps init --non-interactive --environment-id 75dd5fe2-be00-e8ef-b643-353c3cdd9ac7 --display-name "Insurance Quotes" --description "Insurance Quotes Power Apps code app" --build-path dist --file-entry-point index.html --app-url http://localhost:3000 --cloud prod --json
npm install -D @types/node
npm run build
npx power-apps push --non-interactive -s 27da6077-5118-f111-8342-7ced8da0b39a --json
```

## Important Note About CLI Behavior

During setup, `power-apps init` created `power.config.json` successfully but ended with a Windows async assertion after writing the config. Even with that CLI issue, the project was initialized correctly and the later push completed successfully.

Also, for this installed CLI version:

- `push` worked with `-s <solution-id>`
- `push` did not accept `--environment-id`
- `push` did not accept `--cloud`

So for this repo, prefer the working push format shown above.

## Current Power Config

The project is now bound through `power.config.json` with:

- app display name
- app ID
- environment ID
- build path
- hosted/local runtime settings

No Dataverse tables or flow connections have been added yet.

## Hosted App URL

Power Apps returned this play URL after the successful push:

```text
https://apps.powerapps.com/play/e/75dd5fe2-be00-e8ef-b643-353c3cdd9ac7/app/e5302b13-a5de-4b24-8e55-59ee074af302?tenantId=189fd6af-5f23-41d9-8763-cde57608f4e8&hint=5b301f4e-cbd7-494b-b7c9-dbdb1406a19f&sourcetime=1782313976928
```

## Next Phase

Next, we will:

1. decide the insurance app layout and design system
2. define theme, colors, and visual direction
3. build the static structure first
4. add Dataverse data sources and dynamic logic after the UI structure is approved
