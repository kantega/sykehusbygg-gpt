import axios from 'axios'
import FormData from 'form-data'
import * as fs from 'fs';
import _ from 'lodash'

export const transcribeAudio = async (openAIKey: string, filePath: string, model: string): Promise<any> => {
    // Create a new FormData instance
    const form = new FormData()
  
    // Add file and model to the form
    form.append('file', fs.createReadStream(filePath))
    form.append('model', model)
    form.append('language', 'no')
  
    // Make the request to the OpenAI API
    try {
      
      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${openAIKey}`,
        },
      })
  
      return response.data.text
    } catch (error) {
      console.error(`Fetch to OpenAI API failed: ${error}`)
      throw error
    }
  }