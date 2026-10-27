import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import type { Coach, BookingRequest, Lesson, Student } from '../types/coach';
import { t } from '../i18n';

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
        dialogTitle: t('calendar.exportDialogTitle'),
      });
    } else {
      Alert.alert(t('calendar.exportComplete'), t('calendar.exportedTo', { fileName }));
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Export error:', error);
    }
    Alert.alert(t('calendar.exportFailed'), t('calendar.exportFailedBody'));
  }
}
