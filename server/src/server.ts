import express from "express"
import path from 'path'
import * as fs from 'fs';
import http from 'http'
import { Server } from 'socket.io'
import { transcribeAudio } from "./gpt/whisper"
import { Message } from "./gpt/types"
import { UploadAudioData } from "./types"
import dotenv from 'dotenv'
import { FunctionRegistry } from "./gpt/functionRegistry"
import { yrFunctions } from "./yr/yr"
import { exampleFunctions } from "./example/addTwoNumbers"
import { callGptLoop } from "./gpt/gpt";
import { getDefaultMessages } from "./gpt/baseContext";
//import { hueFunctions } from "./hue/hue"
//import { kassalappenFunctions } from "./kassalappen/kassalappen"
dotenv.config()

const functionRegistry = new FunctionRegistry()
functionRegistry.registerFunctions(yrFunctions)
functionRegistry.registerFunctions(exampleFunctions)

//functionRegistry.registerFunctions(hueFunctions)
//functionRegistry.registerFunctions(kassalappenFunctions)

const port = 1234
const app = express()

app.use(express.urlencoded({ extended: true }))
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

const defaultMessages = getDefaultMessages()

io.on('connection', async (socket) => {
  console.log('A user connected')
  try {
    const messages = defaultMessages
    console.log(messages.length)
    const tokensUsed = await callGptLoop(
      process.env.OPENAI_API_KEY!, 
      messages, 
      functionRegistry
    );
    console.log(messages.length)
    
    socket.emit('welcome', { 
      messages: messages,
      tokensUsed: tokensUsed
    });
  } catch (error) {
    console.error('Error handling default messages:', error);
    // Optionally, you can send an error message back to the client
    socket.emit('error', 'Error handling default messages');
  }
  socket.on('uploadAudio', async (inputData: UploadAudioData, callback) => {
    try {
      console.log("Received audio file")
        // Decode the base64 audio data to a buffer
      const audioBuffer = Buffer.from(inputData.audioFile, 'base64')

      // Define the upload path
      const dir = './uploads/'
      fs.mkdirSync(dir, { recursive: true })
      const filePath = path.join(dir, `audio.webm`)

      // Write the buffer to a file
      fs.writeFileSync(filePath, audioBuffer)
      const transcriptionResult = await transcribeAudio(process.env.OPENAI_API_KEY!, filePath, 'whisper-1')
      const userMessage: Message = {
        role: 'user',
        content: transcriptionResult
      }
      const newMessages = [...inputData.messages, userMessage]
      callback({ messages: newMessages })
    } catch(err) {
      console.error(err)
      callback({ error: err })
    }
  })

  socket.on('newMessage', async (messages, callback) => {
    try {
      const result = await callGptLoop(process.env.OPENAI_API_KEY!, messages, functionRegistry)
      callback(
        result
      )
    } catch(err) {
      console.error(err)
      callback({ error: err })
    }
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected')
  })
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
