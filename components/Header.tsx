import { AntDesign } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";

export default function Header() {
    return(
        <View style={styles.logoContainer}>
            <AntDesign name="API" size={50} color="#007AFF" />
            <Text style={styles.logoText}>Loaded Models</Text>
            <Text style={styles.description}>
                Push + to add a new Model
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    logoContainer: {
        alignItems: 'center',
        padding: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    }
});