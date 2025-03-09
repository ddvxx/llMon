import { StyleSheet, View, TouchableOpacity, Text, FlatList, TextInput, ActivityIndicator, Alert } from "react-native";
import React, { useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import {router, useLocalSearchParams } from "expo-router";
import { loadModel } from "@/scripts/llamaInference";
import { LlamaContext } from "llama.rn";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  id: number;
  role: string;
  content: string;
}

export default function ChatScreen(){
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [context, setContext] = useState<LlamaContext | null >(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList<Message>>(null);
  
  const stopWords = ['</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>', 
                    '<|end_of_turn|>', '<|endoftext|>']

  const CHATS_DIRECTORY = `${FileSystem.documentDirectory}chats/`;
  const CHAT_FILE_PATH = CHATS_DIRECTORY + params.model + '_chat.json';

  /* Every time we open the chat view, we have to model and the chat linked to it (both saved locally). 
  In addition, we have to scroll down once the chat is opened and when the chat is flowing. */
  useEffect(() => { loadChat(), loadContext() }, [])
  useEffect(() => { flatListRef.current?.scrollToEnd() }, [messages])

  const loadContext = async () => {
    const context = await loadModel(`${FileSystem.documentDirectory}models/` + params.model);
    setContext(context);
  };

  /* Parsion the chat saved in JSON we obtain the Array of Messages. */
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

  /* Save the chat on the local device executing the app. */
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
  
  /* Window to confirm the deleting of the current chat. */
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

  /* Chat deleting, using the use state hook, we make the chat empty, deleting the file on the system. */
  const deleteChat = async () => {
    try {
      /* We dont want the model to keep completing is we are deleting the chat. */
      if(isCompleting){
        await stopModelMessage()
      }
      await FileSystem.writeAsStringAsync(CHAT_FILE_PATH, '');
      setMessages([]);
      console.log('Chat deleted:', CHAT_FILE_PATH);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  /* Logic for the message sending, this method handles the context completion*/
  const sendModelMessage = async (messageId: number) => {
    try{
      if (!context) {
        console.error('Model not loaded yet.');
        return;
      }
      
      let partialMessage = '';
      setIsCompleting(true);

      /* Create the prompt from the last 4 messages of the chat. 
      We dont want to save too much data, affecting the model performance. */
      const prompt = messages.slice(-4)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n') + `\nuser: ${inputMessage}\nassistant:`;
      
      /* Doing the completion of the model with the loaded context.
      Config parameters will be changable in the future. */
      const textResult = await context.completion(
      {
          prompt: `This is a conversation between user and assistant, a friendly chatbot. Respond in simple markdown.\n\n${prompt}`,
          n_predict: 500,
          stop: [...stopWords, 'user:', 'assistant:']
      },

      /* Once the model is completing, we want to print the partial completion.
      To do this, we check the id of the actual message of the assistant to make
      the update of the message in the component. */
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
      console.log('Result:', textResult.text);
      console.log('Timings:', textResult.timings);
      return textResult.text;

    }catch(error){
      console.error('Error sending message, check your model downloaded.');
    }
  };

  /* Handle the message sending, appending the new messages to the message array of the chat. */
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputMessage
    };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    /* The response of the message have no content.The content of 
    it is going to be available when we execute the completion via sendModelMessage(response.id). */
    const response: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: ''
    };
    setMessages(prev => [...prev, response]);
    await sendModelMessage(response.id);
  };
  
  /* Handle the async stopping of the model inference. */
  const stopModelMessage = async () => {
    context?.stopCompletion()
    setMessages(messages.slice(0, -2))

    /* If the user cancel the inference with this function,
    maybe the user want to send the same message he sent previously. */
    setInputMessage(messages[messages.length - 2].content)
  }

  const backButtonHandle = async () => {
    if(isCompleting){
      await stopModelMessage()
    }
    saveChat()
    setContext(null);
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
          <Ionicons name="chatbubbles-outline" size={32} color="red" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={item => item.id.toString()}
        style={styles.chatList}
        ref = {flatListRef}
        renderItem={({ item }) => (
          <View style={[
            styles.messageContainer, item.role === 'user' ? styles.userMessage : styles.botMessage]}>
            <Text style={item.role === 'user' ? styles.userMessageText : styles.botMessageText}>{item.content}</Text>
          </View>
        )}/>

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
            {context ? (<Ionicons name="send" size={30} color="#007AFF" />) : 
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
      fontSize: 20,
      fontWeight: '600',
      flex: 1,
    },
    chatHeaderDelete: {
      padding: 10,
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
      color: 'white',
      alignSelf: 'flex-end',
      backgroundColor: '#007AFF',
    },
    botMessage: {
      alignSelf: 'flex-start',
      backgroundColor: '#E9ECEF',
    },
    userMessageText: {
      color: 'white',
      fontSize: 18,
    },
    botMessageText: {
      color: '#333',
      fontSize: 18,
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
      fontSize: 18,
      borderRadius: 20,
      padding: 12,
      marginRight: 8,
      maxHeight: 100,
    },
    sendButton: {
      padding: 8,
    },
  });
