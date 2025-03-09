import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as FileSystem from 'expo-file-system';
import { FlatList, TouchableOpacity, View, Text, StyleSheet, Alert } from "react-native";

const CHATS_DIRECTORY = `${FileSystem.documentDirectory}chats/`;

interface ModelListProps {
    models: { name: string; size: string; path: string }[];
}

export default function ModelsList({models}: ModelListProps) {
    /* Handle the deletion of the models and their chats in JSON saved. */
    const deleteModel = async (model: { name: string; size: string; path: string }) => {
      try {
        await FileSystem.deleteAsync(model.path);
        await FileSystem.deleteAsync(CHATS_DIRECTORY + model.name + '_chat.json');
        Alert.alert('Éxito', 'Modelo eliminado correctamente');
      } catch (error) {
        Alert.alert('Error', 'No se pudo eliminar el modelo');
      }
    };

    const confirmDeleteModel = (model: { name: string; size: string; path: string }) => {
      Alert.alert(
        'Confirm Delete',
        `Are you sure you want to delete the model "${model.name}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteModel(model),
          },
        ],
        { cancelable: true }
      );
    };
    
    /* We use the router method in this function to make able to the app to 
    extract information of the model with the useParams hook in other views. */
    const handleModelSelect = (model: { name: string; size: string; path: string }) => {
        router.push(`/chat?model=${model.name}`);
    };

    const renderItem = ({ item }: { item: { name: string; size: string; path: string } }) => (
        <TouchableOpacity onPress={() => handleModelSelect(item)}>
          <View style={styles.modelItem}>
            <Ionicons name="document-outline" size={30} color="#666" style={styles.fileIcon} />
            <View style={styles.modelInfo}>
              <Text style={styles.modelName}>{item.name}</Text>
              <Text style={styles.modelSize}>{item.size}</Text>
              <TouchableOpacity onPress={() => confirmDeleteModel(item)} style={styles.deleteButtonContainer}>
                <Ionicons name="close" size={30} color="#ff3b30" style={styles.fileIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
    );
    
    return(
        <FlatList
        data={models}
        renderItem={renderItem}
        keyExtractor={item => item.name}
        ListEmptyComponent={<Text style={styles.emptyText}> There are no models. </Text>}
        contentContainerStyle={styles.listContent}
        />
    )
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fileIcon: {
    marginRight: 12,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modelSize: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButtonContainer: {
    marginLeft: 'auto',
  },
  deleteButton: {
    color: 'red',
    fontSize: 15
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
});