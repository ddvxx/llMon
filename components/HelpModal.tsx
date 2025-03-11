import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Modal, View, Text, TouchableOpacity, Linking, StyleSheet, ScrollView } from 'react-native';

interface HelpModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function HelpModal({visible, onClose}: HelpModalProps) {
    return(      
        <Modal
        transparent={true}
        visible={visible}
        onRequestClose={() => onClose()}>
            <View style={styles.helpModalContainer}>
                <View style={styles.helpModalContent}>
                    <View style={styles.helpModalHeader}>
                        <Text style={styles.helpModalTitle}>Instructions</Text>
                        <TouchableOpacity 
                            onPress={() => onClose()}
                            style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        <Image source={require('@/assets/images/instructionsGIF.gif')}
                        style={styles.tutorialImage}
                        resizeMode="contain"/>

                        <Text style={styles.instructionsText}>
                            1. Go to HuggingFace with the button provided to search for a Model.{'\n'}
                            2. Once you have it (make sure your device can run it), copy the download link of the file.{'\n'}
                            3. Paste it on the text box and wait until it finish.{'\n'}
                            4. ¡Ready to chat!
                        </Text>
                    </ScrollView>
                    <TouchableOpacity
                    style={styles.repoButton}
                    onPress={() => Linking.openURL('https://github.com/ddvxx/llMon')}>
                        <Ionicons name="logo-github" size={30} color="white" />
                        <Text style={styles.repoButtonText}>Official GitHub</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    helpModalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    helpModalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    helpModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    helpModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 8,
    },
    tutorialImage: {
        width: '100%',
        height: 400,
        borderRadius: 10,
        marginBottom: 20,
    },
    instructionsText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 24,
        marginBottom: 20,
    },
    repoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#333',
        padding: 16,
        borderRadius: 12,
        marginTop: 'auto',
    },
    repoButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    }
});
