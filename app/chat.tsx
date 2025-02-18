import { StyleSheet, View, TouchableOpacity, Text, FlatList, TextInput, ActivityIndicator, Alert } from "react-native";
import React, { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import {router, useLocalSearchParams } from "expo-router";
import { loadModel } from "@/scripts/llamaInference";
import { LlamaContext } from "llama.rn";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen(){
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [context, setContext] = useState<LlamaContext | null | undefined>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const params = useLocalSearchParams();

  const stopWords = ['</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>', '<|end_of_turn|>', '<|endoftext|>']
  const CHATS_DIRECTORY = `${FileSystem.documentDirectory}chats/`;
  const CHAT_FILE_PATH = CHATS_DIRECTORY + params.model + '_chat.json';

  interface Message {
    id: number;
    role: string;
    content: string;
  }

  useEffect(() => { loadChat(),loadContext() }, [])

  const loadContext = async () => {
    const context = await loadModel(`${FileSystem.documentDirectory}models/` + params.model);
    setContext(context);
  };

  const loadChat = async () => {
    try{
      const chatExists = await FileSystem.getInfoAsync(CHAT_FILE_PATH);
      
      if (chatExists.exists) {
        const chatContent = await FileSystem.readAsStringAsync(CHAT_FILE_PATH);
        setMessages(JSON.parse(chatContent));
        console.log('Chat loaded:', chatContent);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const saveChat = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CHATS_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CHATS_DIRECTORY, { intermediates: true });
      }
  
      await FileSystem.writeAsStringAsync(
        CHAT_FILE_PATH,
        JSON.stringify(messages),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
      console.log('Chat saved:', CHAT_FILE_PATH);
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };
  
  const confirmDeleteChat = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete the current chat?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteChat(),
        },
      ],
      { cancelable: true }
    );
  };
  
  const deleteChat = async () => {
    try {
      await FileSystem.writeAsStringAsync(
        CHAT_FILE_PATH,
        ''
      );
      setMessages([]);
      console.log('Chat deleted:', CHAT_FILE_PATH);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const sendModelMessage = async (messageId: number) => {
    try{
      if (!context) {
        console.error('Model not loaded yet.');
        return;
      }
      
      let partialMessage = '';
      setIsCompleting(true);
      const prompt = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n') + `\nuser: ${inputMessage}\nassistant:`;

      const textResult = await context.completion(
        {
          prompt: `This is a conversation between user and assistant, a friendly chatbot. Respond in simple markdown.\n\n${prompt}`,
          n_predict: 500,
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
      setIsCompleting(false);
      console.log('Result:', textResult.text)
      console.log('Timings:', textResult.timings)

      return textResult.text;
    }catch(error){
      console.error('Error sending message, check your model downloaded.');
    }
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
  
  const stopModelMessage = async () => {
    await context?.stopCompletion()
    setMessages(prevMessages => prevMessages.slice(0, -1))
  }

  const backButtonHandle = async () => {
    await saveChat();
    router.push("/");
  };

  return (
      <View style={styles.container}>        
        <View style={styles.chatHeader}>
        <TouchableOpacity onPress={backButtonHandle} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
          <Text style={styles.chatHeaderText}>{params.model}</Text>
        <TouchableOpacity onPress={confirmDeleteChat} style={styles.chatHeaderDelete}>
          <Text style={{ color: "#ff3b30", fontSize: 16, textAlign: "center"}}>Delete chat</Text>
        </TouchableOpacity>
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
         {isCompleting ?(
          <TouchableOpacity onPress={stopModelMessage} style={styles.sendButton}>
            <Ionicons name="stop" size={24} color="black" />
          </TouchableOpacity>):
         
          (<TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={context === null}>
            {context ? (<Ionicons name="send" size={24} color="#007AFF" />) : 
                      (<ActivityIndicator color="black" />)}
          </TouchableOpacity>)}
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
      flex: 1,
    },
    chatHeaderDelete: {
      padding: 5,
      marginLeft: 10,
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
