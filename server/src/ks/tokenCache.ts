import invariant from "tiny-invariant";
import dotenv from "dotenv";
dotenv.config()

// Vi bryr oss bare om ST.Olav for øyeblikket
const TOKEN_URL = process.env.TOKEN_URL;
const CLIENT_ID = process.env.KS_STOLAVS_CLIENT_ID;
const CLIENT_SECRET = process.env.KS_STOLAVS_SECRET;

console.log(process.env.KS_STOLAVS_CLIENT_ID)

const tokenCache = new Map<string, string>();

export async function getToken() {
  invariant(
    CLIENT_ID,
    "Unable to fetch from KS API. Missing env variable KS_STOLAVS_CLIENT_ID",
  );
  invariant(
    CLIENT_SECRET,
    "Unable to fetch from KS API. Missing env variable KS_STOLAVS_SECRET",
  );
  let token = tokenCache.get(CLIENT_ID);
  if (!token || isTokenExpired(token)) {
    const tokenResponse = await fetchToken();
    token = tokenResponse.access_token;
    tokenCache.set(CLIENT_ID, tokenResponse.access_token);
  }
  return token;
}

async function fetchToken(): Promise<TokenResponse> {
  invariant(
    TOKEN_URL,
    "Unable to fetch KS token. Missing env variable TOKEN_URL",
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
  });
  return response.json() as Promise<TokenResponse>;
}

interface TokenResponse {
  access_token: string;
}

interface Token {
  scopes: string[];
  tenant: string;
  iat: number;
  iss: string;
  aud: string;
  sub: string;
  exp: number;
}

function isTokenExpired(token: string) {
  // JWTs are composed of three parts, separated by dots
  const payload = token.split(".")[1];

  // Decode the base64 payload
  const decodedPayload = JSON.parse(atob(payload)) as Token;

  // Get the current date/time
  const currentDate = new Date();
  currentDate.setMinutes(currentDate.getMinutes() + 5);

  // JWT `exp` is in seconds since epoch, but JS Date is in milliseconds since epoch
  const expirationDate = new Date(decodedPayload.exp * 1000);

  return currentDate > expirationDate;
}
