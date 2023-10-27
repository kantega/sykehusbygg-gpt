import { getToken } from "./tokenCache";
import { z } from "zod";

async function fetchFromKS(path: string) {
  const token = await getToken();
  const response = await fetch(
    `https://app-api.klassifikasjonssystemet.no/api/v2.0.0${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.json();
}

export async function getRooms() {
  const json = await fetchFromKS("/rooms");
  return z.array(roomZ).parse(json);
}

export async function getRegionalHealthAuthorities() {
  const json = await fetchFromKS("/regional-health-authorities");
  return z.array(regionalHealthAuthorityZ).parse(json);
}

export async function getLocations() {
  const json = await fetchFromKS("/locations");
  return z.array(locationZ).parse(json);
}

export async function getOrganizations() {
  const json = await fetchFromKS("/organizations");
  return z.array(organizationZ).parse(json);
}

export async function getHovedfunksjoner() {
  const json = await fetchFromKS("/primary-functions");
  return z.array(primaryFunctionZ).parse(json);
}

export async function getDelfunksjoner() {
  const json = await fetchFromKS("/partial-functions");
  return z.array(partialFunctionZ).parse(json);
}

export async function getHovedOgDelfunksjoner() {
  const [hovedfunksjoner, delfunksjoner] = await Promise.all([
    getHovedfunksjoner(),
    getDelfunksjoner(),
  ]);
}

const baseSchema = z.object({
  id: z.string(),
  description: z.string(),
  name: z.string(),
  code: z.string(),
  archived: z.boolean(),
});

export type BaseItem = z.infer<typeof baseSchema>;

const primaryAndPartialFunctionZ = baseSchema.extend({
  delfunksjoner: z.array(baseSchema),
});

export type HovedOgDelfunksjon = z.infer<typeof primaryAndPartialFunctionZ>;

const primaryFunctionZ = baseSchema;

const partialFunctionZ = baseSchema.extend({
  primary_function: z.object({
    id: z.string(),
    code: z.string(),
    deprecated_legacy_id: z.string(),
  }),
});

const organizationZ = baseSchema.extend({
  parent_entity: z
    .object({
      id: z.string(),
      code: z.string(),
      deprecated_legacy_id: z.string(),
    })
    .nullable(),
});

const locationZ = baseSchema;

const regionalHealthAuthorityZ = baseSchema;

const roomZ = baseSchema.extend({
  net_area: z.number(),
  gross_area: z.number(),
  capacity_built_for: z.number(),
  capacity_today: z.number(),
  classification_code: z.string(),
});
