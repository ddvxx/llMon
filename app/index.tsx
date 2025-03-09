import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import DownloadModal from '@/components/DownloadModal';
import ModelsList from '@/components/ModelsList';
import HelpModal from '@/components/HelpModal';

export default function ModelManagerScreen(){
  const [models, setModels] = useState<{ name: string; size: string; path: string }[]>([]);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  /* Every time we open this view, we have to load the models downloaded locally.
  In addition, every time the models array changes, we have to update it. */
  useEffect(() => {
    loadExistingModels();
  }, [models]);

  const loadExistingModels = async () => {
    try {
      /* Root folder of the app itself. */
      const modelsDir = `${FileSystem.documentDirectory}models`;
      const dirExists = await FileSystem.getInfoAsync(modelsDir);
      
      if (!dirExists.exists) {
        await FileSystem.makeDirectoryAsync(modelsDir);
        return;
      }
      
      /* Inside the models folder, we only want to load the .gguf extension. */
      const files = await FileSystem.readDirectoryAsync(modelsDir);
      const ggufFiles = files.filter(file => file.endsWith('.gguf'));
      
      /* We extract the model details for the later representation on the list. */
      const modelDetails = await Promise.all(
        ggufFiles.map(async (file) => {
          const fileInfo = await FileSystem.getInfoAsync(`${modelsDir}/${file}`);
          return {
            name: file,
            size: fileInfo.exists ? (fileInfo.size / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB',
            path: fileInfo.uri
          };
        })
      );
      setModels(modelDetails);

    } catch (error) {
      Alert.alert('Error', 'Could not load existing models');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.helpButton}
        onPress={() => setHelpModalVisible(true)}>
        <Ionicons name="help-circle" size={50} color="#007AFF" />
      </TouchableOpacity>
      <Header/>
      <ModelsList models={models}/>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setDownloadModalVisible(true)}>
        <Ionicons name="add" size={50} color="white" />
      </TouchableOpacity>
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}/>
      <DownloadModal
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        loadExistingModels={loadExistingModels}/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    width: 70,
    height: 70,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  helpButton: {
    padding: 15,
    position: 'absolute',
  }
});
