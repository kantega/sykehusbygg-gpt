import { GPTFunction } from "../gpt/types";
import * as api from './ksApi'

export async function getBuildings () {
  const data = await api.getBuildings()
  return data.map((building) => ({
    bygningsnavn: building.name,
    bygningsbeskrivelse: building.description,
    byggeaar: building.built_in_year,
  }))
}

export const getBuildingsFunctions: GPTFunction[] = [
  {
    func: getBuildings,
    name: getBuildings.name,
    description: 'Henter informasjon om bygninger på norske sykehus. Har info om blant annet byggeår',
    parameters: {
      type:'object',
      properties: {}
    }
  }
]
