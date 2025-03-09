import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from "react-native";

export default function Header() {
    return(
        <View style={styles.logoContainer}>
            <Image source={require('@/assets/images/logollMon.png')} style={styles.logoImage} />
            <Text style={styles.logoText}>Loaded Models</Text>
            <Text style={styles.description}>
                Push + to add a new Model
            </Text>
            <TouchableOpacity 
            style={styles.donateButton}
            onPress={() => Linking.openURL('https://paypal.me/davexpert')}>
                <Ionicons name="heart" size={20} color="#FF3B30" />
                <Text style={styles.donateText}>Support this project</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    logoContainer: {
        alignItems: 'center',
        padding: 20,
        marginBottom: 10,
    },
    logoImage: {
        width: 125,
        height: 125,
        resizeMode: 'contain',
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    donateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#FF3B30',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    donateText: {
        color: '#FF3B30',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    }
});