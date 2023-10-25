import _ from "lodash";
import { Message } from "./types";

const baseContext: Message[] = [
    {
      role: "system",
      content: "Du er en AI assistent. Svarene dine vil være korte, presise og høflige"
    },
    {
      role: "system",
      content: "Gi en hyggelig velkomstmelding til din første bruker"
    }
]
export const getDefaultMessages = (): Message[] => {
    return _.cloneDeep(baseContext)
  } 