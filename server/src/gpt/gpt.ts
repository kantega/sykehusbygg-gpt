import axios from "axios"
import { FunctionRegistry } from "./functionRegistry"
import { ChatCompletionResponse, GPTFunction, Message } from "./types"
import _ from "lodash"

const chatCompletion = async (
    openAIKey: string, 
    messages: Message[],
    functionRegistry: FunctionRegistry
    ): Promise<ChatCompletionResponse> => {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4-0613",
        messages: messages,
        functions: functionRegistry.getOPENAIReadyFunctions()
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`
        },
      }
    )
    if(response.status !== 200) {
      throw new Error(`Failed when communicating with OPENAI API ${response}`)
    }
    return response.data
  }
  

export const callGptLoop = async (
    openAIKey: string,
    originalMessages: Message[], 
    functionRegistry: FunctionRegistry
):Promise<{messages: Message[], tokensUsed:number}> => {
    // Call GPT
    let gptResponse = await chatCompletion(openAIKey, originalMessages, functionRegistry)
    let functionCall = gptResponse.choices[0].message.function_call
    const newMessages: Message[] = _.cloneDeep(originalMessages)

    // While gpt suggests functions, keep calling them
    while(functionCall) {
        // Extract arguments from the suggested function call
        const args = functionCall.arguments
        // Retrieve the actual function from the function registry
        const requestedFunction = functionRegistry.getRequestedFuntion(functionCall.name)
        if(!requestedFunction) {
            originalMessages.push({
              role: 'system',
              content: `The function does not exist, dont try calling it again!'}`
            })
          } else {
            const functionMessages = await callFunction(requestedFunction, args)
            originalMessages.push(...functionMessages)
        }
        // Call gpt with the function result
        gptResponse = await chatCompletion(openAIKey, originalMessages, functionRegistry)
        functionCall = gptResponse.choices[0].message.function_call
    }

    // Gpt didnt suggest any new functions, we return the response to client
    newMessages.push({
        role: gptResponse.choices[0].message.role,
        content: gptResponse.choices[0].message.content
    })
    return {
        messages: newMessages,
        tokensUsed: gptResponse.usage.total_tokens
    }
}

// Calls the function suggested by GPT with args suggested by GPT
const callFunction = async (gptFunction: GPTFunction, args: string): Promise<Message[]> => {
    const messages: Message[] = []
    messages.push({
      role: 'system',
      content: `You called this function ${gptFunction.name} with these arguments ${args}`
    })
    try {
        console.log(`Calling func suggested by gpt ${gptFunction.name} with args ${args}`)
        const result = await gptFunction.func(JSON.parse(args))
        messages.push({
            role: 'system',
            content: `Result of the functioncall: ${JSON.stringify(result)}`
        })
    } catch (error: unknown) {
      console.log(`Functioncall failed ${(error as Error).message}`)
      messages.push({
        role: 'system',
        content: `Dont try this function ${gptFunction.name} with these arguments ${args} again!`
      })
    }
    return messages
  }