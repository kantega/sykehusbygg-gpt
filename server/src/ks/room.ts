import { GPTFunction } from "../gpt/types";
import * as api from './ksApi'

export async function getRooms () {
  const data = await api.getRooms()
  return data.map((rha) => ({
    romnavn: rha.name,
    rombeskrivelse: rha.description,
    brutto_areal_i_kvm: rha.gross_area,
    netto_areal_i_kvm: rha.net_area,
    personkapasitet_i_dag: rha.capacity_today,
  })).slice(0, 100)
}

export const getRoomsFunctions: GPTFunction[] = [
  {
    func: getRooms,
    name: getRooms.name,
    description: 'Henter informasjon om rom på norske sykehus. Har info om blant annet areal og kapasitet',
    parameters: {
      type:'object',
      properties: {}
    }
  }
]
