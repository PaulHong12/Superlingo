import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Image, FlatList, ActivityIndicator, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av'; // Keep Audio import
import Voice from '@react-native-voice/voice'; // Keep Voice import


const API_URL = 'http://172.24.85.87:8000/api'; 
// ------------------------------------------------------------------

const Stack = createStackNavigator();
const AuthContext = createContext();

// --- Reusable Components ---
const AuthInput = ({ placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default' }) => ( <TextInput placeholder={placeholder} value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} style={styles.authInput} placeholderTextColor="#A9A9A9" keyboardType={keyboardType} autoCapitalize="none"/> );
const AuthButton = ({ title, onPress, disabled = false }) => ( <TouchableOpacity style={[styles.authButton, disabled && {backgroundColor: '#a9a9a9'}]} onPress={onPress} disabled={disabled}><Text style={styles.authButtonText}>{title}</Text></TouchableOpacity> );
const TopBar = () => ( <View style={styles.topBar}><Text style={styles.topBarIcon}>🏠</Text><Text style={styles.topBarIcon}>👤</Text><Text style={styles.topBarIcon}>⚙️</Text></View> );

// --- Screens ---
const LoginScreen = () => { /* ... (same as before) ... */
  const { signIn } = useContext(AuthContext);
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!username || !password) { alert('Please enter username and password.'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }), });
      const data = await response.json();
      if (data.token) { signIn(data.token); } else { alert('Login failed.'); }
    } catch (error) { console.error(error); alert('Login error.'); }
    finally { setLoading(false); }
  };
   return (
    <SafeAreaView style={styles.authContainer}>
      <Image source={require('./assets/icon.png')} style={styles.logo} />
      <Text style={styles.appName}>Betterlingo</Text><Text style={styles.tagline}>Login to your account</Text>
      <AuthInput placeholder="Username" value={username} onChangeText={setUsername} />
      <AuthInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <AuthButton title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} />
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}><Text style={styles.switchAuthText}>Don't have an account? Sign up</Text></TouchableOpacity>
    </SafeAreaView>
  );
};
const SignUpScreen = () => { /* ... (same as before) ... */
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSignUp = async () => {
        if (!username || !password || !email) { alert('Please fill in all fields.'); return; }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/register/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, email }), });
            if (response.ok) { alert('Sign up successful! Please log in.'); navigation.navigate('Login'); } else { const errorData = await response.json(); const errorMessage = errorData.username ? errorData.username[0] : JSON.stringify(errorData); alert(`Sign up failed: ${errorMessage}`); }
        } catch (error) { console.error(error); alert('Sign up error.'); }
        finally { setLoading(false); }
    };
    return (
        <SafeAreaView style={styles.authContainer}>
            <Image source={require('./assets/icon.png')} style={styles.logo} />
            <Text style={styles.appName}>Betterlingo</Text><Text style={styles.tagline}>Create a new account</Text>
            <AuthInput placeholder="Username" value={username} onChangeText={setUsername}/>
            <AuthInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address"/>
            <AuthInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <AuthButton title={loading ? "Creating account..." : "Sign Up"} onPress={handleSignUp} disabled={loading} />
            <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={styles.switchAuthText}>Already have an account? Login</Text></TouchableOpacity>
        </SafeAreaView>
    );
};
const LessonPage = ({ navigation }) => { /* ... (same as before) ... */
    const { token, signOut } = useContext(AuthContext);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchLessons = async () => {
             if (!token) { signOut(); return; }
             try {
                const response = await fetch(`${API_URL}/lessons/`, { headers: { 'Authorization': `Token ${token}` }});
                if (!response.ok) { if (response.status === 401) { signOut(); } else { throw new Error(`HTTP error! status: ${response.status}`); } return; }
                const data = await response.json();
                if (Array.isArray(data)) { setLessons(data); }
             } catch (error) { console.error("Fetch lessons error:", error); alert('Could not fetch lessons.'); }
             finally { setLoading(false); }
        }; fetchLessons(); }, [token, signOut]);
    if (loading) { return <SafeAreaView style={styles.pageContainer}><ActivityIndicator size="large" color="#FFC700"/></SafeAreaView>; }
    return (
        <SafeAreaView style={styles.pageContainer}>
            <TopBar/>
            <Text style={styles.pageTitle}>Lessons</Text>
            <FlatList data={lessons} keyExtractor={item => item.id.toString()} renderItem={({ item }) => { try { const lessonContent = item.topics; if (!lessonContent || !lessonContent.title) return null; return ( <TouchableOpacity style={styles.lessonItem} onPress={() => navigation.navigate('Lesson', { lesson: item })}><Text style={styles.lessonTitle}>{lessonContent.title}</Text></TouchableOpacity> ); } catch (e) { console.error("Render lesson error:", item.id, e); return null; } }} />
            <AuthButton title="Sign Out" onPress={signOut} />
        </SafeAreaView>
    );
};

// --- ACTIVITY COMPONENTS (Restored with working interactions) ---

const WordMatchingActivity = ({ activity, onComplete }) => { /* ... (same as working version) ... */
    const originalPairs = useMemo(() => activity.pairs, [activity.pairs]);
    const [pairsState, setPairsState] = useState(() => originalPairs.map(p => ({ p, matched: false })));
    const [selected, setSelected] = useState([]);
    const shuffledWords = useMemo(() => originalPairs.flat().sort(() => 0.5 - Math.random()), [originalPairs]);
    useEffect(() => {
        if (selected.length !== 2) return;
        const [first, second] = selected; let isMatch = false;
        for (const originalPair of originalPairs) { if ((originalPair[0] === first && originalPair[1] === second) || (originalPair[0] === second && originalPair[1] === first)) { isMatch = true; break; } }
        if (isMatch) { setPairsState(currentPairs => currentPairs.map(item => (item.p.includes(first) && item.p.includes(second)) ? { ...item, matched: true } : item )); setSelected([]); }
        else { const timer = setTimeout(() => setSelected([]), 500); return () => clearTimeout(timer); }
    }, [selected, originalPairs]);
    useEffect(() => { if (pairsState.length > 0 && pairsState.every(p => p.matched)) { const timer = setTimeout(() => onComplete(), 500); return () => clearTimeout(timer); } }, [pairsState, onComplete]);
    const handleSelect = (word) => { const pairInfo = pairsState.find(({ p }) => p.includes(word)); const isMatched = pairInfo ? pairInfo.matched : false; if (!isMatched && selected.length < 2 && !selected.includes(word)) { setSelected(currentSelected => [...currentSelected, word]); } };
    return ( <View style={styles.activityContainer}><Text style={styles.activityTitle}>{activity.title}</Text><View style={styles.wordBank}>{shuffledWords.map((word, index) => { const pairInfo = pairsState.find(({ p }) => p.includes(word)); const isMatched = pairInfo ? pairInfo.matched : false; const isSelected = selected.includes(word); return ( <TouchableOpacity key={`${word}-${index}`} style={[ styles.wordOption, isSelected && !isMatched && styles.wordSelected, isMatched && styles.wordMatched, ]} onPress={() => handleSelect(word)} disabled={isMatched || (selected.length >= 2 && !isSelected)} ><Text style={styles.wordOptionText}>{word}</Text></TouchableOpacity> ); })}</View></View> );
};

const WordOrderingActivity = ({ activity, onComplete }) => { /* ... (same as working version) ... */
    const initialWords = useMemo(() => [...activity.words].sort(() => 0.5 - Math.random()), [activity.words]);
    const [wordOptions, setWordOptions] = useState(initialWords);
    const [orderedSentence, setOrderedSentence] = useState([]);
    const [isCorrect, setIsCorrect] = useState(null);
    const handleSelectOption = (word, index) => { setOrderedSentence(prev => [...prev, word]); setWordOptions(prev => prev.filter((w, i) => i !== index)); setIsCorrect(null); };
    const handleDeselect = (word, index) => { setWordOptions(prev => [...prev, word]); setOrderedSentence(prev => prev.filter((w, i) => i !== index)); setIsCorrect(null); };
    const checkAnswer = () => { const correct = orderedSentence.join(' ') === activity.prompt; setIsCorrect(correct); if (correct) { setTimeout(() => onComplete(), 1000); } else { alert('Not quite right. Try rearranging!'); } };
    return ( <View style={styles.activityContainer}><Text style={styles.activityTitle}>{activity.title}</Text><View style={[styles.wordBank, styles.sentenceBank]}>{orderedSentence.map((word, index) => ( <TouchableOpacity key={`${word}-${index}`} style={styles.wordOption} onPress={() => handleDeselect(word, index)}><Text style={styles.wordOptionText}>{word}</Text></TouchableOpacity> ))}{orderedSentence.length === 0 && <Text style={styles.placeholderText}>Tap words below</Text>}</View><View style={styles.wordBank}>{wordOptions.map((word, index) => ( <TouchableOpacity key={`${word}-${index}`} style={styles.wordOption} onPress={() => handleSelectOption(word, index)}><Text style={styles.wordOptionText}>{word}</Text></TouchableOpacity> ))}</View><AuthButton title={isCorrect === true ? "Correct!" : "Check"} onPress={checkAnswer} disabled={wordOptions.length > 0 || isCorrect === true} />{isCorrect === false && <Text style={styles.tryAgainText}>Try again!</Text>}</View> );
};

const ListeningActivity = ({ activity, onComplete }) => {
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const { token } = useContext(AuthContext); // Get token

// Inside ListeningActivity component in App.js

const playSound = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    let newSound = null; // Keep track of the sound object

    try {
        if (!token) { alert("Auth error."); setIsPlaying(false); return; }

        const response = await fetch(`${API_URL}/generate-gemini-audio/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
            body: JSON.stringify({ text: activity.prompt_audio_text })
        });

        if (!response.ok) {
            // Try to get error message from backend response body
            let errorMsg = `Audio generation failed: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || JSON.stringify(errorData);
            } catch (e) { /* Ignore parsing error */ }
            throw new Error(errorMsg);
        }

        // --- FIX: Get URL from JSON, not blob ---
        const data = await response.json();
        const audioUrl = data.audioUrl;
        if (!audioUrl) {
            throw new Error("Backend did not return an audio URL.");
        }
        console.log("Received audio URL:", audioUrl);
        // --- END OF FIX ---

        // --- FIX: Load sound directly from URL ---
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
           { uri: audioUrl }, // Use the URL directly
           { shouldPlay: true }
        );
        newSound = sound; // Assign to outer variable
        // --- END OF FIX ---

        newSound.setOnPlaybackStatusUpdate(status => {
            if (status.didJustFinish) {
                console.log('Playback finished');
                newSound.unloadAsync(); // Unload when done
                setSound(null);         // Clear state
                setIsPlaying(false);
            } else if (status.isLoaded === false && status.error) {
                 console.error("Playback Error:", status.error);
                 setIsPlaying(false);
                 alert("Could not play audio from URL.");
                 // Attempt cleanup even on error
                 if (newSound) {
                    newSound.unloadAsync();
                    setSound(null);
                 }
            } else if (status.isLoaded === true && status.isPlaying) {
                 console.log("Playback started");
            }
        });
        setSound(newSound); // Set the sound state

    } catch (error) {
        console.error("Sound Fetch/Process Error:", error);
        alert(`Could not get or play audio: ${error.message}`);
        setIsPlaying(false);
        // Ensure cleanup if sound object was created before error
        if (newSound) {
            newSound.unloadAsync();
            setSound(null);
        }
    }
    // No need for finally block resetting isPlaying, setOnPlaybackStatusUpdate handles it
};

// Make sure the useEffect cleanup remains the same:
useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound on component unmount');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);


    const handleSelectAnswer = (option) => { /* ... (same as before) ... */
        setSelectedAnswer(option);
        if (option === activity.correct_answer) { setTimeout(() => onComplete(), 500); }
        else { alert('Incorrect. Listen again or try another answer!'); setTimeout(() => setSelectedAnswer(null), 1000); }
    };

    return ( /* ... (same UI as before) ... */
        <View style={styles.activityContainer}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <TouchableOpacity onPress={playSound} style={styles.soundButton} disabled={isPlaying}>
                {isPlaying ? <ActivityIndicator color="#4B4B4B" /> : <Text style={{fontSize: 50}}>🔊</Text>}
            </TouchableOpacity>
            <View style={styles.choiceContainer}>
                {activity.options.map(option => (
                    <TouchableOpacity key={option} style={[styles.choiceButton, selectedAnswer === option && styles.choiceSelected]} onPress={() => handleSelectAnswer(option)} disabled={selectedAnswer !== null} >
                        <Text style={styles.choiceButtonText}>{option}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

// --- LESSON CONTROLLER SCREEN (Restored) ---
const LessonScreen = ({ route, navigation }) => {
    const { lesson } = route.params || {};
    const [activityIndex, setActivityIndex] = useState(0);

    const lessonContent = lesson?.topics;
    if (!lessonContent || !Array.isArray(lessonContent.activities) || lessonContent.activities.length === 0) {
        return <SafeAreaView style={styles.pageContainer}><Text>Error: Invalid lesson data.</Text></SafeAreaView>;
    }

    const handleActivityComplete = () => {
        if (activityIndex < lessonContent.activities.length - 1) {
            setActivityIndex(prevIndex => prevIndex + 1);
        } else {
            navigation.navigate('Score');
        }
    };

    const currentActivity = lessonContent.activities[activityIndex];
    let activityComponent;
    switch (currentActivity?.type) {
        case 'MATCHING': activityComponent = <WordMatchingActivity activity={currentActivity} onComplete={handleActivityComplete} />; break;
        case 'ORDERING': activityComponent = <WordOrderingActivity activity={currentActivity} onComplete={handleActivityComplete} />; break;
        case 'LISTENING': activityComponent = <ListeningActivity activity={currentActivity} onComplete={handleActivityComplete} />; break;
        default: activityComponent = <Text>Unknown or invalid activity type</Text>;
    }

    return (
        <SafeAreaView style={styles.pageContainer}>
            <TopBar/>
            <Text style={styles.pageTitle}>{lessonContent.title} (Step {activityIndex + 1}/{lessonContent.activities.length})</Text>
            {/* RENDER THE INTERACTIVE ACTIVITY */}
            {activityComponent}
             {/* ADD BACK THE AI CHAT BUTTON */}
             <AuthButton
                title="Practice with AI Tutor"
                onPress={() => navigation.navigate('Chat', {
                    lessonTitle: lessonContent.title,
                    activityContext: currentActivity // Pass current activity context
                })}
            />
        </SafeAreaView>
    );
};


// --- SEPARATE ChatScreen (Text-based, No TTS) ---
const ChatScreen = ({ route, navigation }) => { /* ... (same as before, text only) ... */
    const { lessonTitle, activityContext } = route.params || {};
    const { token } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [isResponding, setIsResponding] = useState(false);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef();
    useEffect(() => {
        if (Platform.OS !== 'web') {
            Voice.onSpeechError = (e) => { console.error('STT Error:', e); setIsListening(false); };
            Voice.onSpeechResults = (e) => { if (e.value && e.value[0]) { handleUserMessage(e.value[0]); } setIsListening(false); };
            Voice.onSpeechEnd = () => setIsListening(false);
        }
        const firstMessage = `Okay, let's practice "${activityContext?.title || lessonTitle}". Ask me anything or try using the key words!`;
        setMessages([{ role: 'tutor', content: firstMessage }]);
        return () => { if (Platform.OS !== 'web') { Voice.destroy().then(Voice.removeAllListeners); } };
    }, [lessonTitle, activityContext]);
    const handleUserMessage = (text) => {
        if (!text || text.trim() === '' || isResponding) return;
        const newMessage = { role: 'user', content: text.trim() };
        setMessages(prev => [...prev, newMessage]);
        setInputText('');
        getAIResponse(text.trim());
    };
    const getAIResponse = async (userMessage) => {
        if (!activityContext || isResponding || !token) return;
        setIsResponding(true);
        try {
            const response = await fetch(`${API_URL}/chat/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }, body: JSON.stringify({ message: userMessage, context: activityContext, lesson_title: lessonTitle }), });
             if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.reply) { const aiMessage = { role: 'tutor', content: data.reply }; setMessages(prev => [...prev, aiMessage]); } else { throw new Error('Invalid AI response'); }
        } catch (error) { console.error("AI Response error:", error); alert('Failed to get AI response.'); }
        finally { setIsResponding(false); }
    };
    const toggleListen = async () => { if (Platform.OS === 'web') { alert("Voice input not supported in web browser."); return; } if (isListening) { try { await Voice.stop(); } catch (e) { console.error("Voice stop error:", e); } setIsListening(false); } else { try { await Voice.start('en-US'); setIsListening(true); } catch (e) { console.error("Voice start error:", e); setIsListening(false);} } };
    return (
<SafeAreaView style={styles.pageContainer}>
            <TopBar/>
            <Text style={styles.pageTitle}>AI Tutor: {lessonTitle}</Text>

            {/* --- FIX: Add overflow: 'scroll' specifically for web --- */}
            <View style={{
                flex: 1,
                // Add overflow only for web platform
                ...(Platform.OS === 'web' && { overflowY: 'scroll', overflowX: 'hidden' })
             }}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(_, index) => index.toString()}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
                    onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
                    renderItem={({ item }) => (
                        <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.tutorBubble]}>
                            <Text style={styles.messageText}>{item.content}</Text>
                        </View>
                    )}
                    // Remove flex: 1, keep margins
                    style={{ marginVertical: 10 }}
                    // Add some bottom padding inside the list for better spacing
                    contentContainerStyle={{ paddingBottom: 10 }}
                 />
            </View>
            {/* --- END FIX --- */}

            {isResponding && <ActivityIndicator style={{ marginVertical: 5 }} color="#FFC700"/>}

            <View style={styles.inputArea}>
                 <TextInput style={styles.chatInput} value={inputText} onChangeText={setInputText} placeholder="Type or tap mic..." onSubmitEditing={() => handleUserMessage(inputText)} />
                {Platform.OS !== 'web' && ( <TouchableOpacity style={[styles.smallMicButton, isListening && styles.micButtonActive]} onPress={toggleListen} disabled={isResponding}><Image source={require('./assets/icon.png')} style={{width: 25, height: 25}}/></TouchableOpacity> )}
                <TouchableOpacity style={styles.sendButton} onPress={() => handleUserMessage(inputText)} disabled={isResponding || !inputText.trim()}><Text>Send</Text></TouchableOpacity>
            </View>

            <AuthButton title="Back to Lesson" onPress={() => navigation.goBack()} />
        </SafeAreaView>
    );
};


const ScoreScreen = ({ navigation }) => ( /* ... (same as before) ... */
    <SafeAreaView style={[styles.pageContainer, {justifyContent: 'center', alignItems: 'center'}]}>
        <Image source={require('./assets/icon.png')} style={{width: 150, height: 150, resizeMode: 'contain'}}/>
        <Text style={styles.scoreText}>Lesson Complete!</Text><Text style={styles.scoreNumber}>100</Text>
        <View style={{marginTop: 40, width: '100%'}}><AuthButton title="Continue" onPress={() => navigation.replace('LessonPage')} /></View>
    </SafeAreaView>
);

// --- Auth Provider and Root Navigator ---
const AuthStack = () => ( <Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="Login" component={LoginScreen} /><Stack.Screen name="SignUp" component={SignUpScreen} /></Stack.Navigator> );
// ADD CHAT SCREEN BACK TO APP STACK
const AppStack = () => ( <Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="LessonPage" component={LessonPage} /><Stack.Screen name="Lesson" component={LessonScreen} /><Stack.Screen name="Chat" component={ChatScreen} /><Stack.Screen name="Score" component={ScoreScreen} /></Stack.Navigator> );

function App() { /* ... (same auth logic as before) ... */
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => { const bootstrapAsync = async () => { let token; try { token = await AsyncStorage.getItem('userToken'); } catch (e) {} setUserToken(token); setIsLoading(false); }; bootstrapAsync(); }, []);
    const authContext = { signIn: async (token) => { await AsyncStorage.setItem('userToken', token); setUserToken(token); }, signOut: async () => { await AsyncStorage.removeItem('userToken'); setUserToken(null); }, token: userToken, };
    if (isLoading) { return <ActivityIndicator style={{flex: 1}} size="large"/>; }
    return ( <AuthContext.Provider value={authContext}><NavigationContainer>{userToken == null ? <AuthStack /> : <AppStack />}</NavigationContainer></AuthContext.Provider> );
}

// --- STYLESHEET (Updated for Activities) ---
const styles = StyleSheet.create({
    authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F0FFF0' },
    logo: { width: 100, height: 100, marginBottom: 20, resizeMode: 'contain' },
    appName: { fontSize: 32, fontWeight: 'bold', color: '#4B4B4B', marginBottom: 5 },
    tagline: { fontSize: 16, color: '#6E6E6E', marginBottom: 30 },
    authInput: { width: '100%', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    authButton: { width: '100%', backgroundColor: '#FFC700', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, marginTop: 10 },
    authButtonText: { fontSize: 16, fontWeight: 'bold', color: '#4B4B4B' },
    switchAuthText: { color: '#6E6E6E', marginTop: 20 },
    pageContainer: { flex: 1, backgroundColor: '#F0FFF0', paddingHorizontal: 20, paddingTop: 10 },
    topBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, marginBottom: 10, backgroundColor: '#fff', borderRadius: 20, elevation: 1 },
    topBarIcon: { fontSize: 24 },
    pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#4B4B4B', marginBottom: 15, textAlign: 'center' },
    lessonItem: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    lessonTitle: { fontSize: 18, fontWeight: '600', color: '#4B4B4B' },
    scoreText: { fontSize: 24, color: '#4B4B4B', marginTop: 20 },
    scoreNumber: { fontSize: 72, fontWeight: 'bold', color: '#4B4B4B' },
    // Activity Styles
    activityContainer: { flex: 1, width: '100%', padding: 10, backgroundColor: '#fff', borderRadius: 15, marginBottom: 20 },
    activityTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#4B4B4B' },
    wordBank: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20, minHeight: 60, paddingVertical: 10 },
    wordOption: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, margin: 5, borderWidth: 2, borderColor: '#dcdcdc', elevation: 1 },
    wordOptionText: { fontSize: 16, color: '#333' },
    wordSelected: { backgroundColor: '#FFDEAD', borderColor: '#FFC700' },
    wordMatched: { backgroundColor: '#e0e0e0', borderColor: '#c0c0c0', opacity: 0.5 },
    sentenceBank: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#e0e0e0' },
    placeholderText: { color: '#aaa', fontStyle: 'italic', alignSelf: 'center'},
    tryAgainText: { color: 'red', textAlign: 'center', marginTop: 10 },
    soundButton: { alignSelf: 'center', marginVertical: 30, backgroundColor: '#fff', padding: 20, borderRadius: 50, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    choiceContainer: { marginTop: 20},
    choiceButton: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: '#e0e0e0' },
    choiceSelected: { borderColor: '#FFC700', backgroundColor: '#FFFACD'},
    choiceButtonText: { textAlign: 'center', fontSize: 16, fontWeight: '500' },
    // Chat Screen Styles
    inputArea: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#fff' },
    chatInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 8, backgroundColor: '#fff' },
    sendButton: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#FFC700', borderRadius: 20 },
    chatList: { flex: 1 },
    messageBubble: { padding: 10, borderRadius: 15, marginVertical: 3, maxWidth: '80%' },
    userBubble: { backgroundColor: '#FFDEAD', alignSelf: 'flex-end' },
    tutorBubble: { backgroundColor: '#E0E0E0', alignSelf: 'flex-start' },
    messageText: { fontSize: 15, color: '#4B4B4B' },
    smallMicButton: { backgroundColor: '#FFC700', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    micButtonActive: { backgroundColor: '#ff725e' },
});

export default App; // Ensure this is the only default export