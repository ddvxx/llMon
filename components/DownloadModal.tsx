import { AntDesign } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Linking, StyleSheet, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

interface DownloadModalProps {
    visible: boolean;
    onClose: () => void;
    loadExistingModels: () => void;
}

export default function DownloadModal({visible, onClose, loadExistingModels}: DownloadModalProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadable, setDownloadable] = useState<FileSystem.DownloadResumable | undefined>(undefined);
    const [downloadUrl, setDownloadUrl] = useState('');

    const Progress = ({ progress }: { progress: number }) => (
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    );

    const handleCancel = async() => {
      onClose();
      downloadable?.cancelAsync();
      if (downloadable?.fileUri) {
        await FileSystem.deleteAsync(downloadable.fileUri);
      }
      setDownloadUrl('');
    };

    const openHuggingFace = () => {
        Linking.openURL('https://huggingface.co/models?library=gguf');
    };

    const checkFileExists = async (modelsDir: string, fileName: string) => {
      try {
        const dirInfo = await FileSystem.getInfoAsync(modelsDir);
        if (dirInfo.exists) {
          const files = await FileSystem.readDirectoryAsync(modelsDir);
          if (files.includes(fileName)) {
            Alert.alert('Error', 'A model with the same name already exists');
            return true;
          }
        } else {
          await FileSystem.makeDirectoryAsync(modelsDir, { intermediates: true });
        }
      } catch (error) {
        Alert.alert('Error', 'Could not check existing models. Please try again.');
        return true;
      }
      return false;
    };
    
    const checkFileSize = async (url: string) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          const contentLength = response.headers.get('Content-Length');
          if (contentLength) {
            const fileSize = parseInt(contentLength, 10);
            const freeSpace = await FileSystem.getFreeDiskStorageAsync();
            if (fileSize > freeSpace) {
              Alert.alert('Error', 'Not enough storage space to download the model');
              return false;
            }
            return true;
          }
        }
        Alert.alert('Error', 'Could not retrieve file size');
        return false;
      } catch (error) {
        Alert.alert('Error', 'Could not check file size. Please try again.');
        return false;
      }
    };

    const downloadModel = async () => {
      const fileName = downloadUrl.split('/').pop();
      const modelsDir = `${FileSystem.documentDirectory}models`;
      const fileUri = `${modelsDir}/${fileName}`;

      if (!downloadUrl.trim()) {
        Alert.alert('Error', 'Please, enter a valid URL');
        return;
      }

      if (!downloadUrl.toLowerCase().endsWith('.gguf')) {
        Alert.alert('Error', 'The URL must include a .gguf Model file');
        return;
      }

      if (!fileName) {
        Alert.alert('Error', 'Invalid file name');
        return;
      }
      
      const fileExists = await checkFileExists(modelsDir, fileName);
      if (fileExists) return;
      
      const canDownload = await checkFileSize(downloadUrl);
      if (!canDownload) return;

      setIsDownloading(true);

      try {
        const downloadResumable = FileSystem.createDownloadResumable(downloadUrl, fileUri, {},
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            setDownloadProgress(progress);
          }
        );

        setDownloadable(downloadResumable);
        
        const downloadResult = await downloadResumable.downloadAsync();
        if (downloadResult && downloadResult.uri) {
          Alert.alert('Done', 'Model downloaded successfully');

          setDownloadUrl('');
          loadExistingModels();
          onClose();
        }
      } catch (error) {
        Alert.alert('Error', 'Could not download the model. Check the URL or conection and try again');
      } finally {
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    };

    return(      
        <Modal
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
        animationType='slide'>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Download new Model</Text>
            <TouchableOpacity
              style={styles.huggingFaceButton}
              onPress={openHuggingFace}>
              <Text style={styles.huggingFaceButtonText}>
                Search models in HuggingFace
              </Text>
              <AntDesign name="export" size={20} color="#007AFF" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Enter model .gguf URL"
              value={downloadUrl}
              onChangeText={setDownloadUrl}
              autoCapitalize="none"
              autoCorrect={false}
              numberOfLines={1}/>

            {isDownloading && (
              <View style={styles.progressContainer}>
                <Progress progress={downloadProgress} />
                <Text style={styles.progressText}>
                  {Math.round(downloadProgress * 100)}%
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.downloadButton]}
                onPress={downloadModel}
                disabled={isDownloading}>
                {isDownloading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Download</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  huggingFaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  huggingFaceButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
  },
  downloadButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});
