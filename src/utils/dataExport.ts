import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import type { Coach, BookingRequest, Lesson, Student } from '../types/coach';

export interface ExportData {
  coach: Coach;
  bookingRequests: BookingRequest[];
  lessons: Lesson[];
  students: Student[];
  exportDate: string;
  version: string;
}

export async function exportData(data: Omit<ExportData, 'exportDate' | 'version'>): Promise<void> {
  try {
    const exportData: ExportData = {
      ...data,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const fileName = `coachos-backup-${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export CoachOS Data',
      });
    } else {
      Alert.alert('Export Complete', `Data exported to: ${fileName}`);
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Export error:', error);
    }
    Alert.alert('Export Failed', 'Unable to export data. Please try again.');
  }
}

export async function importData(): Promise<ExportData | null> {
  try {
    // This would typically use DocumentPicker or similar
    // For now, we'll just show instructions
    Alert.alert(
      'Import Data',
      'To import data, paste your backup JSON in the app settings or contact support.',
      [{ text: 'OK' }]
    );
    return null;
  } catch (error) {
    if (__DEV__) {
      console.error('Import error:', error);
    }
    Alert.alert('Import Failed', 'Unable to import data. Please check the file format.');
    return null;
  }
}