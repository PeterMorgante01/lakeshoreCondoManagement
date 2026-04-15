require("dotenv").config();

const http = require("http");
const https = require("https");

function postForm(urlString, formData) {
  const url = new URL(urlString);
  const payload = new URLSearchParams(formData).toString();
  const transport = url.protocol === "http:" ? http : https;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        method: "POST",
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const body = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              reject(
                new Error(
                  `Token request failed with ${res.statusCode}: ${JSON.stringify(body)}`
                )
              );
              return;
            }
            resolve(body);
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  const realm = process.env.KEYCLOAK_REALM;
  const authServerUrl = process.env.KEYCLOAK_AUTH_SERVER_URL;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
  const username = process.argv[2];
  const password = process.argv[3];

  if (!realm || !authServerUrl || !clientId || !username || !password) {
    throw new Error(
      "Usage: node scripts/get-keycloak-token.js <username> <password> with KEYCLOAK_* values set in .env"
    );
  }

  const tokenUrl = `${String(authServerUrl).replace(/\/+$/, "")}/realms/${realm}/protocol/openid-connect/token`;
  const form = {
    client_id: clientId,
    grant_type: "password",
    username,
    password
  };

  if (clientSecret) {
    form.client_secret = clientSecret;
  }

  const tokenResponse = await postForm(tokenUrl, form);

  console.log(
    JSON.stringify(
      {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type
      },
      null,
      2
    )
  );
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
