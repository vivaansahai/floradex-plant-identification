import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Alert } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '@/FirebaseConfig'; // Adjust import to match your Firebase configuration

/**
 * Function to send the image to the API and handle the response.
 * @param {FormData} formData - The FormData object containing the image data.
 * @returns {Object} - The identified plant information.
 */
export const fetchPlantIdentification = async (formData) => {
  try {
    const response = await axios.post(
      'https://my-api.plantnet.org/v2/identify/all?api-key=2b10qLUOKbLEwEMbSY7IHBAwD',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const bestMatch = response.data.bestMatch;
    console.log('Response:', response.data);
    console.log('Identified Plant:', bestMatch);

    return bestMatch;
  } catch (error) {
    console.error('Error in API call:', error.message);
    throw new Error('Failed to fetch plant identification.');
  }
};



/**
 * Function to identify the plant from a captured image URI.
 * @param {string} imageUri - The URI of the captured image.
 * @param {string} userId - The user ID.
 * @returns {Object} - Contains the identified species and the image URI.
 */
export const identifyPlant = async (imageUri) => {
  try {
    // Validate and retrieve file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist at the given URI.');
    }

    // Prepare the image file as FormData
    const fileBlob = {
      uri: fileInfo.uri,
      name: 'captured_image.jpg', // Change the name as required
      type: 'image/jpeg', // Ensure the type matches the actual file type
    };

    const formData = new FormData();
    formData.append('images', fileBlob);

    // Call the fetchPlantIdentification function
    const species = await fetchPlantIdentification(formData);

    // Store species and userId in Firestore
    

    return { species, imageUri }; // Return both species and image URI
  } catch (error) {
    console.error('Error in plant identification:', error.message);
    Alert.alert('Error', 'Failed to identify the plant. Please try again.', [
      { text: 'OK', onPress: () => console.log('Error alert closed') },
    ]);
    throw error;
  }
};

/**
 * Function to pick an image using the ImagePicker and identify the plant.
 * @param {string} userId - The user ID.
 */
export const pickImageAndIdentifyPlant = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) {
      console.log('Image selection cancelled');
      Alert.alert('No Image Selected', 'Please select an image to identify a plant.', [
        { text: 'OK', onPress: () => console.log('No image alert closed') },
      ]);
      return;
    }

    const imageUri = result.assets[0].uri;
    console.log('Selected Image URI:', imageUri);

    // Call the identifyPlant function with the selected image URI and userId
    const identificationResult = await identifyPlant(imageUri);

    console.log('Plant Identification Result:', identificationResult);

    return identificationResult;
  } catch (error) {
    console.error('Error during image picking and identification:', error.message);
    Alert.alert('Error', 'An error occurred while identifying the plant. Please try again.', [
      { text: 'OK', onPress: () => console.log('Error alert closed') },
    ]);
  }
};
