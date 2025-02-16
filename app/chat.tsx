import { StyleSheet, View, TouchableOpacity, Text, FlatList, TextInput, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import {router, useLocalSearchParams } from "expo-router";
import { loadModel } from "@/scripts/llamaInference";
import { LlamaContext } from "llama.rn";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen(){
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const params = useLocalSearchParams();
  const [context, setContext] = useState<LlamaContext | null | undefined>(null);
  const stopWords = ['</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>', '<|end_of_turn|>', '<|endoftext|>']
  const CHATS_DIRECTORY = `${FileSystem.documentDirectory}chats/`;

  interface Message {
    id: number;
    role: string;
    content: string;
  }

  useEffect(() => { createChatDirectory(), loadContext(), loadChat()}, [])

  const loadContext = async () => {
    const context = await loadModel(`${FileSystem.documentDirectory}models/` + params.model);
    setContext(context);
  };

  const createChatDirectory = async () => {
    try {
      const chatsDir = CHATS_DIRECTORY + params.model + '_chat' + '.json';
      const chatsExists = await FileSystem.getInfoAsync(chatsDir);
      
      if (!chatsExists.exists) {
        await FileSystem.makeDirectoryAsync(chatsDir);
      }
    } catch (error) {
      console.error('Error creating chat directory:', error);
    }
  }

  const loadChat = async () => {
    try{
      const chatsDir = CHATS_DIRECTORY + params.model;
      const chatsExists = await FileSystem.getInfoAsync(chatsDir);
      
      if (chatsExists.exists) {
        const chatContent = await FileSystem.readAsStringAsync(chatsDir);
        setMessages(JSON.parse(chatContent));
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const saveChat = async () => {
    try {
      const chatPath = CHATS_DIRECTORY + params.model;
      await FileSystem.writeAsStringAsync(
        chatPath,
        JSON.stringify(messages),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };
  
  const deleteChat = async () => {
    try {
      const chatPath = CHATS_DIRECTORY + params.model;
      await FileSystem.deleteAsync(chatPath);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }

  const sendModelMessage = async (messageId: number) => {
    if (!context) {
      console.error('Model not loaded yet.');
      return;
    }
    
    let partialMessage = '';
    const prompt = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n') + `\nuser: ${inputMessage}\nassistant:`;

    const textResult = await context.completion(
      {
        prompt: `This is a conversation between user and assistant, a friendly chatbot. Respond in simple markdown.\n\n${prompt}`,
        n_predict: 50,
        stop: [...stopWords, 'user:', 'assistant:'],
        // ...other params
      },
      (data) => {
        const { token } = data;
        partialMessage += token;
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, content: partialMessage } : msg
        ));
        console.log('Partial completion:', token);
        },
    );
    
    console.log('Result:', textResult.text)
    console.log('Timings:', textResult.timings)

    return textResult.text;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputMessage
    };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    const response: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: ''
    };
    setMessages(prev => [...prev, response]);

    await sendModelMessage(response.id);
  };
  
  const backButtonHandle = async () => {
    await saveChat();
    router.push("/");
  }

  return (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backButton} onPress={backButtonHandle}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.chatHeaderText}>{params.model}</Text>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={item => item.id.toString()}
        style={styles.chatList}
        renderItem={({ item }) => (
          <View style={[
            styles.messageContainer, item.role === 'user' ? styles.userMessage : styles.botMessage]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.chatInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Enter your message..."
          multiline/>
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={context === null}>
          {context ? (<Ionicons name="send" size={24} color="#007AFF" />) : 
                     (<ActivityIndicator color="black" />)}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    backButton: {
      marginRight: 16,
    },
    chatHeaderText: {
      fontSize: 18,
      fontWeight: '600',
    },
    chatList: {
      flex: 1,
      padding: 16,
    },
    messageContainer: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
      marginBottom: 8,
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#007AFF',
    },
    botMessage: {
      alignSelf: 'flex-start',
      backgroundColor: '#E9ECEF',
    },
    messageText: {
      color: '#333',
      fontSize: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderTopColor: '#eee',
      alignItems: 'center',
    },
    chatInput: {
      flex: 1,
      backgroundColor: '#f0f0f0',
      borderRadius: 20,
      padding: 12,
      marginRight: 8,
      maxHeight: 100,
    },
    sendButton: {
      padding: 8,
    },
  });
