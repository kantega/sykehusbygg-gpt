import { GPTFunction } from "../gpt/types";
import * as api from './ksApi'

const baseUrl = 'https://api.met.no/weatherapi/locationforecast/2.0/compact'
const headers = {
  'User-Agent': 'Jarvis home Assistant'
};

export async function getRegionalHealthAuthorities () {
  const data = await api.getRegionalHealthAuthorities()
  return data.map((rha) => ({
    name: rha.name,
    description: rha.description,
  }))
}

export const regionalHealthAuthoritiesFunctions: GPTFunction[] = [
  {
    func: getRegionalHealthAuthorities,
    name: getRegionalHealthAuthorities.name,
    description: 'Henter informasjon om regionale helseforetak',
    parameters: {
      type:'object',
      properties: {}
    }
  }
]
