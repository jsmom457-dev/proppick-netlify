# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## AI stage render + Firebase persistence

1. Put `OPENAI_API_KEY` in the root `.env` file.
2. Install dependencies with `npm install`.
3. Run client and API together with `npm run dev:all`.
   - Vite client: `http://localhost:5173`
   - API server: `http://localhost:3001`
4. The final render flow calls `POST /api/render-stage` and generates Front first, then derives Side and Top from that canonical Front image.
5. Final render images and render-input images are uploaded to Firebase Storage. Project/detail data, render settings, canvas objects, image URLs, prompts, and the latest render snapshot are saved in Firestore under the same project document.
