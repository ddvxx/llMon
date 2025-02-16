import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import DownloadModal from '@/components/DownloadModal';
import ModelsList from '@/components/ModelsList';

export default function ModelManagerScreen(){
  const [models, setModels] = useState<{ name: string; size: string; path: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const loadExistingModels = async () => {
    try {
      const modelsDir = `${FileSystem.documentDirectory}models`;
      const dirExists = await FileSystem.getInfoAsync(modelsDir);
      
      if (!dirExists.exists) {
        await FileSystem.makeDirectoryAsync(modelsDir);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(modelsDir);
      const ggufFiles = files.filter(file => file.endsWith('.gguf'));
      
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

  useEffect(() => {
    loadExistingModels();
  }, [models]);

  return (
    <View style={styles.container}>
      <Header/>
      <ModelsList models={models}/>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>

      <DownloadModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        loadExistingModels={loadExistingModels}
      />
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
