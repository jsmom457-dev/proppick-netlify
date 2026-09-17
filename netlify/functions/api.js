import serverless from "serverless-http";

import app from "../../server/index.js";

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  if (
    event.body &&
    typeof event.body === "string" &&
    event.headers?.["content-type"]?.includes("application/json")
  ) {
    try {
      const parsedBody = JSON.parse(event.body);

      event.body = JSON.stringify(parsedBody);
      event.isBase64Encoded = false;
    } catch (error) {
      console.error(
        "[Netlify] JSON body parse failed:",
        error
      );
    }
  }

  return serverlessHandler(event, context);
};