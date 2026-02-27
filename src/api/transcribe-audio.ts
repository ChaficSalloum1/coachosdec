/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom audio transcription service that uses a custom API endpoint maintained by Vibecode.
You can use this function to transcribe audio files, and it will return the text of the audio file.
*/

interface AudioFileData {
  uri: string;
  type: string;
  name: string;
}

/**
 * Transcribe an audio file
 * @param localAudioUri - The local URI of the audio file to transcribe. Obtained via the expo-av library.
 * @returns The text of the audio file
 */
export const transcribeAudio = async (localAudioUri: string): Promise<string> => {
  try {
    // Create FormData for the audio file
    const formData = new FormData();
    const audioFile: AudioFileData = {
      uri: localAudioUri,
      type: "audio/m4a",
      name: "recording.m4a",
    };
    formData.append("file", audioFile as any); // FormData append requires any for React Native file objects
    formData.append("model", "gpt-4o-transcribe");
    formData.append("language", "en");

    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    // API call to OpenAI's gpt-4o-transcribe
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const result = await response.json();

    if (!result.text || typeof result.text !== 'string') {
      throw new Error('Invalid response from transcription API');
    }

    return result.text;
  } catch (error) {
    if (__DEV__) {
      console.error("Transcription error:", error);
    }
    // Return error message instead of re-throwing to prevent unhandled rejections
    throw new Error(error instanceof Error ? error.message : 'Transcription failed. Please try again.');
  }
};
