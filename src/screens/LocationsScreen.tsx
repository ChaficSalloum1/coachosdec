import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

import { useCoachStore } from '../state/coachStore';
import { showToast } from '../state/toastStore';
import { Area, Facility, Court } from '../types/coach';
import { DesignTokens } from '../utils/designTokens';
import { t } from '../i18n';

type TabType = 'areas' | 'facilities' | 'courts';

export function LocationsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('areas');

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
          {t('settings.locations')}
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200">
        {(['areas', 'facilities', 'courts'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => {
              setActiveTab(tab);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-1 py-4 items-center"
            style={{
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: DesignTokens.colors.brand.default,
            }}
          >
            <Text
              className="text-base font-medium capitalize"
              style={{
                color: activeTab === tab ? DesignTokens.colors.brand.default : DesignTokens.colors.text.muted,
              }}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <View className="flex-1">
        {activeTab === 'areas' && <AreasTab />}
        {activeTab === 'facilities' && <FacilitiesTab />}
        {activeTab === 'courts' && <CourtsTab />}
      </View>
    </View>
  );
}

function AreasTab() {
  const { areas, addArea, updateArea, deleteArea, coach } = useCoachStore();
  const [showForm, setShowForm] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  const handleAdd = () => {
    setEditingArea(null);
    setShowForm(true);
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setShowForm(true);
  };

  const handleDelete = (area: Area) => {
    Alert.alert(
      t('locations.deleteAreaTitle'),
      t('locations.deleteAreaBody', { name: area.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteArea(area.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-4 py-6">
        {areas.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="location-outline" size={64} color={DesignTokens.colors.text.muted} />
            <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: DesignTokens.colors.text.strong }}>
              {t('locations.noAreasYet')}
            </Text>
            <Text className="text-base text-center" style={{ color: DesignTokens.colors.text.muted }}>
              {t('locations.createAreasHint')}
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {areas.map((area) => (
              <Pressable
                key={area.id}
                onPress={() => handleEdit(area)}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:bg-gray-50"
                style={{ minHeight: 44 }}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
                    {area.name}
                  </Text>
                  <Pressable
                    onPress={() => handleDelete(area)}
                    className="p-2 active:bg-gray-200 rounded-lg"
                  >
                    <Ionicons name="trash-outline" size={20} color={DesignTokens.colors.red['800']} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <View className="px-4 pb-6">
        <Pressable
          onPress={handleAdd}
          className="rounded-lg py-4 px-4 active:opacity-80"
          style={{ backgroundColor: DesignTokens.colors.brand.default, minHeight: 44 }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-base font-medium text-white ml-2">
              {t('locations.addArea')}
            </Text>
          </View>
        </Pressable>
      </View>

      <AreaFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        area={editingArea}
        onSave={(name) => {
          if (editingArea) {
            updateArea(editingArea.id, { name });
          } else if (coach) {
            const newArea: Area = {
              id: uuidv4(),
              coachId: coach.id,
              name,
            };
            addArea(newArea);
          }
          setShowForm(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      />
    </View>
  );
}

function FacilitiesTab() {
  const { facilities, areas, addFacility, updateFacility, deleteFacility, coach } = useCoachStore();
  const [showForm, setShowForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  const handleAdd = () => {
    if (areas.length === 0) {
      showToast(t('locations.createAreaBeforeFacilities'), 'error');
      return;
    }
    setEditingFacility(null);
    setShowForm(true);
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setShowForm(true);
  };

  const handleDelete = (facility: Facility) => {
    Alert.alert(
      t('locations.deleteFacilityTitle'),
      t('locations.deleteFacilityBody', { name: facility.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteFacility(facility.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-4 py-6">
        {facilities.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="business-outline" size={64} color={DesignTokens.colors.text.muted} />
            <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: DesignTokens.colors.text.strong }}>
              {t('locations.noFacilitiesYet')}
            </Text>
            <Text className="text-base text-center" style={{ color: DesignTokens.colors.text.muted }}>
              {t('locations.addFacilitiesHint')}
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {facilities.map((facility) => {
              const area = areas.find(a => a.id === facility.areaId);
              return (
                <Pressable
                  key={facility.id}
                  onPress={() => handleEdit(facility)}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:bg-gray-50"
                  style={{ minHeight: 44 }}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold mb-1" style={{ color: DesignTokens.colors.text.strong }}>
                        {facility.name}
                      </Text>
                      <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
                        {area?.name}
                      </Text>
                      {facility.address && (
                        <Text className="text-sm mt-1" style={{ color: DesignTokens.colors.text.muted }}>
                          {facility.address}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleDelete(facility)}
                      className="p-2 active:bg-gray-200 rounded-lg"
                    >
                      <Ionicons name="trash-outline" size={20} color={DesignTokens.colors.red['800']} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <View className="px-4 pb-6">
        <Pressable
          onPress={handleAdd}
          className="rounded-lg py-4 px-4 active:opacity-80"
          style={{ backgroundColor: DesignTokens.colors.brand.default, minHeight: 44 }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-base font-medium text-white ml-2">
              {t('locations.addFacility')}
            </Text>
          </View>
        </Pressable>
      </View>

      <FacilityFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        facility={editingFacility}
        areas={areas}
        onSave={(data) => {
          if (editingFacility) {
            updateFacility(editingFacility.id, data);
          } else if (coach) {
            const newFacility: Facility = {
              id: uuidv4(),
              coachId: coach.id,
              ...data,
            };
            addFacility(newFacility);
          }
          setShowForm(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      />
    </View>
  );
}

function CourtsTab() {
  const { courts, facilities, areas, addCourt, updateCourt, deleteCourt, coach } = useCoachStore();
  const [showForm, setShowForm] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  const handleAdd = () => {
    if (facilities.length === 0) {
      showToast(t('locations.createFacilityBeforeCourts'), 'error');
      return;
    }
    setEditingCourt(null);
    setShowForm(true);
  };

  const handleEdit = (court: Court) => {
    setEditingCourt(court);
    setShowForm(true);
  };

  const handleDelete = (court: Court) => {
    Alert.alert(
      t('locations.deleteCourtTitle'),
      t('locations.deleteCourtBody', { name: court.label }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteCourt(court.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-4 py-6">
        {courts.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="tennisball-outline" size={64} color={DesignTokens.colors.text.muted} />
            <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: DesignTokens.colors.text.strong }}>
              {t('locations.noCourtsYet')}
            </Text>
            <Text className="text-base text-center" style={{ color: DesignTokens.colors.text.muted }}>
              {t('locations.addCourtsHint')}
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {courts.map((court) => {
              const facility = facilities.find(f => f.id === court.facilityId);
              const area = facility ? areas.find(a => a.id === facility.areaId) : null;
              return (
                <Pressable
                  key={court.id}
                  onPress={() => handleEdit(court)}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:bg-gray-50"
                  style={{ minHeight: 44 }}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold mb-1" style={{ color: DesignTokens.colors.text.strong }}>
                        {court.label}
                      </Text>
                      <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
                        {facility?.name} • {area?.name}
                      </Text>
                      {court.sport && (
                        <Text className="text-sm mt-1" style={{ color: DesignTokens.colors.text.muted }}>
                          {court.sport}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleDelete(court)}
                      className="p-2 active:bg-gray-200 rounded-lg"
                    >
                      <Ionicons name="trash-outline" size={20} color={DesignTokens.colors.red['800']} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <View className="px-4 pb-6">
        <Pressable
          onPress={handleAdd}
          className="rounded-lg py-4 px-4 active:opacity-80"
          style={{ backgroundColor: DesignTokens.colors.brand.default, minHeight: 44 }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-base font-medium text-white ml-2">
              {t('locations.addCourt')}
            </Text>
          </View>
        </Pressable>
      </View>

      <CourtFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        court={editingCourt}
        facilities={facilities}
        areas={areas}
        onSave={(data) => {
          if (editingCourt) {
            updateCourt(editingCourt.id, data);
          } else if (coach) {
            const newCourt: Court = {
              id: uuidv4(),
              coachId: coach.id,
              ...data,
            };
            addCourt(newCourt);
          }
          setShowForm(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      />
    </View>
  );
}

// Form Modals
interface AreaFormModalProps {
  visible: boolean;
  onClose: () => void;
  area: Area | null;
  onSave: (name: string) => void;
}

function AreaFormModal({ visible, onClose, area, onSave }: AreaFormModalProps) {
  const [name, setName] = useState(area?.name || '');

  React.useEffect(() => {
    setName(area?.name || '');
  }, [area]);

  const handleSave = () => {
    if (!name.trim()) {
      showToast(t('locations.enterAreaName'), 'error');
      return;
    }
    onSave(name.trim());
    setName('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Pressable onPress={onClose}>
            <Text className="text-base" style={{ color: DesignTokens.colors.brand.default }}>{t('common.cancel')}</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
            {area ? t('locations.editArea') : t('locations.addArea')}
          </Text>
          <Pressable onPress={handleSave}>
            <Text className="text-base font-medium" style={{ color: DesignTokens.colors.brand.default }}>{t('common.save')}</Text>
          </Pressable>
        </View>

        <View className="p-4">
          <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
            {t('locations.areaNameRequired')}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
            placeholder={t('locations.areaNamePlaceholder')}
            style={{ color: DesignTokens.colors.text.strong }}
            autoFocus
          />
        </View>
      </View>
    </Modal>
  );
}

interface FacilityFormModalProps {
  visible: boolean;
  onClose: () => void;
  facility: Facility | null;
  areas: Area[];
  onSave: (data: { areaId: string; name: string; address?: string; notes?: string }) => void;
}

function FacilityFormModal({ visible, onClose, facility, areas, onSave }: FacilityFormModalProps) {
  const [areaId, setAreaId] = useState(facility?.areaId || areas[0]?.id || '');
  const [name, setName] = useState(facility?.name || '');
  const [address, setAddress] = useState(facility?.address || '');
  const [notes, setNotes] = useState(facility?.notes || '');

  React.useEffect(() => {
    setAreaId(facility?.areaId || areas[0]?.id || '');
    setName(facility?.name || '');
    setAddress(facility?.address || '');
    setNotes(facility?.notes || '');
  }, [facility, areas]);

  const handleSave = () => {
    if (!name.trim() || !areaId) {
      showToast(t('locations.enterFacilityName'), 'error');
      return;
    }
    onSave({
      areaId,
      name: name.trim(),
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setName('');
    setAddress('');
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Pressable onPress={onClose}>
            <Text className="text-base" style={{ color: DesignTokens.colors.brand.default }}>{t('common.cancel')}</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
            {facility ? t('locations.editFacility') : t('locations.addFacility')}
          </Text>
          <Pressable onPress={handleSave}>
            <Text className="text-base font-medium" style={{ color: DesignTokens.colors.brand.default }}>{t('common.save')}</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                {t('locations.areaRequired')}
              </Text>
              <View className="bg-gray-50 rounded-lg border border-gray-200">
                {areas.map((area) => (
                  <Pressable
                    key={area.id}
                    onPress={() => setAreaId(area.id)}
                    className="px-3 py-3 flex-row items-center"
                    style={{
                      borderBottomWidth: areas.indexOf(area) < areas.length - 1 ? 1 : 0,
                      borderBottomColor: DesignTokens.colors.line.default,
                    }}
                  >
                    <Ionicons
                      name={areaId === area.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={DesignTokens.colors.brand.default}
                    />
                    <Text className="text-base ml-3" style={{ color: DesignTokens.colors.text.strong }}>
                      {area.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                {t('locations.facilityNameRequired')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder={t('locations.facilityNamePlaceholder')}
                style={{ color: DesignTokens.colors.text.strong }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                {t('locations.addressOptional')}
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder={t('locations.addressPlaceholder')}
                style={{ color: DesignTokens.colors.text.strong }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                {t('locations.notesOptional')}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder={t('locations.notesPlaceholder')}
                style={{ color: DesignTokens.colors.text.strong, textAlignVertical: 'top' }}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

interface CourtFormModalProps {
  visible: boolean;
  onClose: () => void;
  court: Court | null;
  facilities: Facility[];
  areas: Area[];
  onSave: (data: { facilityId: string; label: string; sport?: string }) => void;
}

function CourtFormModal({ visible, onClose, court, facilities, areas, onSave }: CourtFormModalProps) {
  const [facilityId, setFacilityId] = useState(court?.facilityId || facilities[0]?.id || '');
  const [label, setLabel] = useState(court?.label || '');
  const [sport, setSport] = useState(court?.sport || '');

  React.useEffect(() => {
    setFacilityId(court?.facilityId || facilities[0]?.id || '');
    setLabel(court?.label || '');
    setSport(court?.sport || '');
  }, [court, facilities]);

  const handleSave = () => {
    if (!label.trim() || !facilityId) {
      showToast(t('locations.enterCourtLabel'), 'error');
      return;
    }
    onSave({
      facilityId,
      label: label.trim(),
      sport: sport.trim() || undefined,
    });
    setLabel('');
    setSport('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Pressable onPress={onClose}>
            <Text className="text-base" style={{ color: DesignTokens.colors.brand.default }}>{t('common.cancel')}</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: DesignTokens.colors.text.strong }}>
            {court ? t('locations.editCourt') : t('locations.addCourt')}
          </Text>
          <Pressable onPress={handleSave}>
            <Text className="text-base font-medium" style={{ color: DesignTokens.colors.brand.default }}>{t('common.save')}</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                {t('locations.facilityRequired')}
              </Text>
              <View className="bg-gray-50 rounded-lg border border-gray-200">
                {facilities.map((facility) => {
                  const area = areas.find(a => a.id === facility.areaId);
                  return (
                    <Pressable
                      key={facility.id}
                      onPress={() => setFacilityId(facility.id)}
                      className="px-3 py-3 flex-row items-center"
                      style={{
                        borderBottomWidth: facilities.indexOf(facility) < facilities.length - 1 ? 1 : 0,
                        borderBottomColor: DesignTokens.colors.line.default,
                      }}
                    >
                      <Ionicons
                        name={facilityId === facility.id ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={DesignTokens.colors.brand.default}
                      />
                      <View className="ml-3">
                        <Text className="text-base" style={{ color: DesignTokens.colors.text.strong }}>
                          {facility.name}
                        </Text>
                        <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
                          {area?.name}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                {t('locations.courtLabelRequired')}
              </Text>
              <TextInput
                value={label}
                onChangeText={setLabel}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder={t('locations.courtLabelPlaceholder')}
                style={{ color: DesignTokens.colors.text.strong }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: DesignTokens.colors.text.strong }}>
                {t('locations.sportOptional')}
              </Text>
              <TextInput
                value={sport}
                onChangeText={setSport}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder={t('locations.sportPlaceholder')}
                style={{ color: DesignTokens.colors.text.strong }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
