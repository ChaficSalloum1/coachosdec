/**
 * Utility to add code that clears AsyncStorage on next app launch
 * This will force the app to start fresh without old data
 */

console.log('To clear AsyncStorage, you need to run this in the app itself.');
console.log('Add this code temporarily to your App.tsx:');
console.log('');
console.log('import AsyncStorage from \'@react-native-async-storage/async-storage\';');
console.log('');
console.log('// Add to useEffect:');
console.log('useEffect(() => {');
console.log('  AsyncStorage.clear().then(() => console.log(\'✅ AsyncStorage cleared\'));');
console.log('}, []);');
