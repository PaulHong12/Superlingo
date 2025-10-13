import React, { useState, useEffect, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Image, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CONFIGURATION ---
const API_URL = 'http://172.30.208.1:8000/api';
const Stack = createStackNavigator();

// --- REUSABLE UI COMPONENTS ---

const AuthInput = ({ placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default' }) => (
  <TextInput
    placeholder={placeholder}
    value={value}
    onChangeText={onChangeText}
    secureTextEntry={secureTextEntry}
    style={styles.authInput}
    placeholderTextColor="#A9A9A9"
    keyboardType={keyboardType}
    autoCapitalize="none"
  />
);

const AuthButton = ({ title, onPress, disabled = false }) => (
  <TouchableOpacity style={[styles.authButton, disabled && {backgroundColor: '#a9a9a9'}]} onPress={onPress} disabled={disabled}>
    <Text style={styles.authButtonText}>{title}</Text>
  </TouchableOpacity>
);

const TopBar = () => (
  <View style={styles.topBar}>
    <Text style={styles.topBarIcon}>🏠</Text>
    <Text style={styles.topBarIcon}>👤</Text>
    <Text style={styles.topBarIcon}>⚙️</Text>
  </View>
);

// --- AUTHENTICATION SCREENS ---

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            alert('Please enter your username and password.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok && data.token) {
                await AsyncStorage.setItem('userToken', data.token);
                navigation.replace('LessonPage', { token: data.token });
            } else {
                alert(data.error || 'Login failed. Please check credentials.');
            }
        } catch (error) {
            console.error('Login request failed:', error);
            alert('Login error. Is the backend server running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.authContainer}>
            <Image source={require('./assets/icon.png')} style={styles.logo} />
            <Text style={styles.appName}>Betterlingo</Text>
            <Text style={styles.tagline}>Login to your account</Text>
            <AuthInput placeholder="Username" value={username} onChangeText={setUsername} />
            <AuthInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <AuthButton title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} />
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.switchAuthText}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const SignUpScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!username || !password || !email) {
            alert('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email }),
            });
            if (response.ok) {
                alert('Sign up successful! Please log in.');
                navigation.navigate('Login');
            } else {
                const errorData = await response.json();
                alert(`Sign up failed: ${errorData.username ? errorData.username[0] : JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error(error);
            alert('Sign up error. Is the backend server running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.authContainer}>
            <Image source={require('./assets/icon.png')} style={styles.logo} />
            <Text style={styles.appName}>Betterlingo</Text>
            <Text style={styles.tagline}>Create a new account</Text>
            <AuthInput placeholder="Username" value={username} onChangeText={setUsername}/>
            <AuthInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address"/>
            <AuthInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <AuthButton title={loading ? "Creating account..." : "Sign Up"} onPress={handleSignUp} disabled={loading} />
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.switchAuthText}>Already have an account? Login</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

// --- CORE APP SCREENS ---

const LessonPage = ({ navigation, route }) => {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const token = route.params?.token || await AsyncStorage.getItem('userToken');
                if (!token) {
                    navigation.replace('Login');
                    return;
                }
                // get lesson data from Backend
                const response = await fetch(`${API_URL}/lessons/`, { headers: { 'Authorization': `Token ${token}` } });
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        await AsyncStorage.removeItem('userToken');
                        navigation.replace('Login');
                    }
                    return;
                }
                const data = await response.json();
                setLessons(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch lessons:", error);
                navigation.replace('Login');
            } finally {
                setLoading(false);
            }
        };
        fetchLessons();
    }, [navigation, route.params?.token]);

    if (loading) {
        return <SafeAreaView style={styles.pageContainer}><ActivityIndicator size="large" color="#FFC700"/></SafeAreaView>;
    }

    return (
        <SafeAreaView style={styles.pageContainer}>
            <TopBar/>
            <Text style={styles.pageTitle}>Lessons</Text>
            <FlatList
                data={lessons}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.lessonItem}
                        onPress={() => navigation.navigate('Lesson', { lessonContent: item.topics })}
                    >
                        <Text style={styles.lessonTitle}>{item.topics?.title || 'Untitled Lesson'}</Text>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
};

// --- ACTIVITY COMPONENTS ---

const WordMatchingActivity = ({ activity, onComplete }) => {
    const [pairs, setPairs] = useState(activity.pairs.map(p => ({ p, matched: false })));
    const [selected, setSelected] = useState([]);
    const shuffledWords = useMemo(() => activity.pairs.flat().sort(() => 0.5 - Math.random()), [activity.pairs]);

    useEffect(() => {
        if (selected.length !== 2) return;

        const [first, second] = selected;
        // define the logic for how we set the pairs 
        setPairs(currentPairs => {
            const isMatch = currentPairs.some(({ p }) => p.includes(first) && p.includes(second));
            if (isMatch) {
                return currentPairs.map(item =>
                    (item.p.includes(first) && item.p.includes(second)) ? { ...item, matched: true } : item
                );
            }
            return currentPairs;
        });
        
        setTimeout(() => setSelected([]), 300);

    }, [selected]);

    useEffect(() => {
        if (pairs.length > 0 && pairs.every(p => p.matched)) {
            setTimeout(() => onComplete(), 500);
        }
    }, [pairs, onComplete]);

    const handleSelect = (word) => {
        if (selected.length < 2) {
            setSelected(currentSelected => [...currentSelected, word]);
        }
    };

    return (
        <View style={styles.activityContainer}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <View style={styles.wordBank}>
                {shuffledWords.map((word, index) => {
                    const pairInfo = pairs.find(({ p }) => p.includes(word));
                    const isMatched = pairInfo ? pairInfo.matched : false;
                    const isSelected = selected.includes(word);
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.wordOption,
                                isSelected && !isMatched && styles.wordSelected,
                                isMatched && styles.wordMatched
                            ]}
                            onPress={() => !isMatched && !isSelected && handleSelect(word)}
                            disabled={isMatched}
                        >
                            <Text>{word}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const WordOrderingActivity = ({ activity, onComplete }) => {
    const [wordOptions, setWordOptions] = useState(() => activity.words.sort(() => 0.5 - Math.random()));
    const [orderedSentence, setOrderedSentence] = useState([]);

    const handleSelectOption = (word) => {
        setOrderedSentence(prev => [...prev, word]);
        setWordOptions(prev => prev.filter((_, i) => prev[i] !== word));
    };
    
    const handleDeselect = (word, index) => {
        setWordOptions(prev => [...prev, word]);
        setOrderedSentence(prev => prev.filter((_, i) => i !== index));
    };

    const checkAnswer = () => {
        if (orderedSentence.join(' ') === activity.prompt) {
            onComplete();
        } else {
            alert('Try again!');
        }
    };

    return (
        <View style={styles.activityContainer}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <View style={[styles.wordBank, styles.sentenceBank]}>
                {orderedSentence.map((word, index) => (
                    <TouchableOpacity key={index} style={styles.wordOption} onPress={() => handleDeselect(word, index)}>
                        <Text>{word}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.wordBank}>
                 {wordOptions.map((word, index) => (
                    <TouchableOpacity key={index} style={styles.wordOption} onPress={() => handleSelectOption(word)}>
                        <Text>{word}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <AuthButton title="Check" onPress={checkAnswer} disabled={wordOptions.length > 0} />
        </View>
    );
};

import { Audio } from 'expo-av'; // <-- Make sure this import is at the top of your App.js

const ListeningActivity = ({ activity, onComplete }) => {
    // Use a state to manage the sound object and loading status
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const playSound = async () => {
        if (isPlaying) return;
        setIsPlaying(true);

        try {
            // --- 1. Get the auth token to make an authenticated request ---
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                alert("Authentication error. Please log in again.");
                setIsPlaying(false);
                return;
            }

            // --- 2. Call your new backend endpoint ---
            const response = await fetch(`${API_URL}/generate-audio/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}` // CRITICAL: Authenticate the request
                },
                body: JSON.stringify({ text: activity.prompt_audio_text })
            });

            if (!response.ok) {
                throw new Error('Failed to generate audio from server.');
            }

            // --- 3. Get the audio data as a 'blob' ---
            const blob = await response.blob();
            const uri = URL.createObjectURL(blob); // Create a temporary local URL for the blob

            // --- 4. Load and play the sound using expo-av ---
            const { sound } = await Audio.Sound.createAsync({ uri });
            setSound(sound);
            await sound.playAsync();

        } catch (error) {
            console.error("Error playing sound:", error);
            alert("Could not play audio.");
        } finally {
            setIsPlaying(false);
        }
    };

    // This useEffect is for cleanup. It unloads the sound from memory
    // when the component is removed from the screen to prevent memory leaks.
    useEffect(() => {
        return sound
            ? () => {
                console.log('Unloading Sound');
                sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    const handleSelectAnswer = (option) => {
        if (option === activity.correct_answer) {
            onComplete();
        } else {
            alert('Incorrect. Try again!');
        }
    };

    return (
        <View style={styles.activityContainer}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <TouchableOpacity onPress={playSound} style={styles.soundButton} disabled={isPlaying}>
                {isPlaying ? <ActivityIndicator color="#000" /> : <Text style={{fontSize: 50}}>🔊</Text>}
            </TouchableOpacity>
            <View>
                {activity.options.map(option => (
                    <TouchableOpacity key={option} style={styles.choiceButton} onPress={() => handleSelectAnswer(option)}>
                        <Text style={styles.choiceButtonText}>{option}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

// --- LESSON CONTROLLER SCREEN ---

const LessonScreen = ({ route, navigation }) => {
    const { lessonContent } = route.params;
    const [activityIndex, setActivityIndex] = useState(0);

    if (!lessonContent || !lessonContent.activities) {
        return <SafeAreaView style={styles.pageContainer}><Text>Error: Could not load lesson.</Text></SafeAreaView>;
    }

    const handleActivityComplete = () => {
        if (activityIndex < lessonContent.activities.length - 1) {
            setActivityIndex(activityIndex + 1);
        } else {
            navigation.navigate('Score');
        }
    };

    const currentActivity = lessonContent.activities[activityIndex];
    let activityComponent;

    switch (currentActivity.type) {
        case 'MATCHING':
            activityComponent = <WordMatchingActivity activity={currentActivity} onComplete={handleActivityComplete} />;
            break;
        case 'ORDERING':
            activityComponent = <WordOrderingActivity activity={currentActivity} onComplete={handleActivityComplete} />;
            break;
        case 'LISTENING':
            activityComponent = <ListeningActivity activity={currentActivity} onComplete={handleActivityComplete} />;
            break;
        default:
            activityComponent = <Text>Unknown activity type</Text>;
    }

    return (
        <SafeAreaView style={styles.pageContainer}>
            <TopBar/>
            <Text style={styles.pageTitle}>{lessonContent.title}</Text>
            {activityComponent}
        </SafeAreaView>
    );
};

// --- SCORE SCREEN ---

const ScoreScreen = ({ navigation }) => (
    <SafeAreaView style={[styles.pageContainer, {justifyContent: 'center', alignItems: 'center'}]}>
        <Image source={require('./assets/icon.png')} style={{width: 150, height: 150, resizeMode: 'contain'}}/>
        <Text style={styles.scoreText}>Lesson Complete!</Text>
        <Text style={styles.scoreNumber}>100</Text>
        <View style={{marginTop: 40, width: '100%'}}>
            <AuthButton title="Continue" onPress={() => navigation.replace('LessonPage')} />
        </View>
    </SafeAreaView>
);

// --- MAIN APP NAVIGATOR ---

const App = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#F0FFF0' } }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="LessonPage" component={LessonPage} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
      <Stack.Screen name="Score" component={ScoreScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

// --- STYLESHEET ---

const styles = StyleSheet.create({
    authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F0FFF0' },
    logo: { width: 100, height: 100, marginBottom: 20, resizeMode: 'contain' },
    appName: { fontSize: 32, fontWeight: 'bold', color: '#4B4B4B', marginBottom: 5 },
    tagline: { fontSize: 16, color: '#6E6E6E', marginBottom: 30 },
    authInput: { width: '100%', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    authButton: { width: '100%', backgroundColor: '#FFC700', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    authButtonText: { fontSize: 16, fontWeight: 'bold', color: '#4B4B4B' },
    switchAuthText: { color: '#6E6E6E', marginTop: 20 },
    pageContainer: { flex: 1, backgroundColor: '#F0FFF0', paddingHorizontal: 20, paddingTop: 10 },
    topBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, marginBottom: 10, backgroundColor: '#fff', borderRadius: 20, elevation: 1 },
    topBarIcon: { fontSize: 24 },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#4B4B4B', marginBottom: 20, textAlign: 'center' },
    lessonItem: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    lessonTitle: { fontSize: 18, fontWeight: '600', color: '#4B4B4B' },
    scoreText: { fontSize: 24, color: '#4B4B4B', marginTop: 20 },
    scoreNumber: { fontSize: 72, fontWeight: 'bold', color: '#4B4B4B' },
    activityContainer: { flex: 1, width: '100%' },
    activityTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#4B4B4B' },
    wordBank: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20, minHeight: 60 },
    sentenceBank: { backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#e0e0e0' },
    wordOption: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, margin: 5, borderWidth: 2, borderColor: '#dcdcdc' },
    wordSelected: { backgroundColor: '#a7d8ff', borderColor: '#007bff' },
    wordMatched: { backgroundColor: '#e0e0e0', borderColor: '#c3e6cb', opacity: 0.6 },
    soundButton: { alignSelf: 'center', marginVertical: 30, backgroundColor: '#fff', padding: 30, borderRadius: 100, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    choiceButton: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: '#e0e0e0' },
    choiceButtonText: { textAlign: 'center', fontSize: 16, fontWeight: '500' },
});

export default App;