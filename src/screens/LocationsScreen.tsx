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

import { useCoachStore } from '../state/coachStore';
import { Area, Facility, Court } from '../types/coach';

type TabType = 'areas' | 'facilities' | 'courts';

export function LocationsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('areas');

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-semibold" style={{ color: '#0B1220' }}>
          Locations
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
              borderBottomColor: '#1E88E5',
            }}
          >
            <Text
              className="text-base font-medium capitalize"
              style={{
                color: activeTab === tab ? '#1E88E5' : '#42526E',
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
      'Delete Area',
      `Are you sure you want to delete "${area.name}"? This will also delete all facilities and courts in this area.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
            <Ionicons name="location-outline" size={64} color="#42526E" />
            <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: '#0B1220' }}>
              No areas yet
            </Text>
            <Text className="text-base text-center" style={{ color: '#42526E' }}>
              Create areas to organize your{"\n"}coaching locations
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
                  <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
                    {area.name}
                  </Text>
                  <Pressable
                    onPress={() => handleDelete(area)}
                    className="p-2 active:bg-gray-200 rounded-lg"
                  >
                    <Ionicons name="trash-outline" size={20} color="#C62828" />
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
          style={{ backgroundColor: '#1E88E5', minHeight: 44 }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-base font-medium text-white ml-2">
              Add Area
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
              id: `area_${Date.now()}`,
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
      Alert.alert('No Areas', 'Please create an area first before adding facilities.');
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
      'Delete Facility',
      `Are you sure you want to delete "${facility.name}"? This will also delete all courts in this facility.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
            <Ionicons name="business-outline" size={64} color="#42526E" />
            <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: '#0B1220' }}>
              No facilities yet
            </Text>
            <Text className="text-base text-center" style={{ color: '#42526E' }}>
              Add facilities within your areas{"\n"}like clubs or venues
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
                      <Text className="text-lg font-semibold mb-1" style={{ color: '#0B1220' }}>
                        {facility.name}
                      </Text>
                      <Text className="text-sm" style={{ color: '#42526E' }}>
                        {area?.name}
                      </Text>
                      {facility.address && (
                        <Text className="text-sm mt-1" style={{ color: '#42526E' }}>
                          {facility.address}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleDelete(facility)}
                      className="p-2 active:bg-gray-200 rounded-lg"
                    >
                      <Ionicons name="trash-outline" size={20} color="#C62828" />
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
          style={{ backgroundColor: '#1E88E5', minHeight: 44 }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-base font-medium text-white ml-2">
              Add Facility
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
              id: `facility_${Date.now()}`,
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
      Alert.alert('No Facilities', 'Please create a facility first before adding courts.');
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
      'Delete Court',
      `Are you sure you want to delete "${court.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
            <Ionicons name="tennisball-outline" size={64} color="#42526E" />
            <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: '#0B1220' }}>
              No courts yet
            </Text>
            <Text className="text-base text-center" style={{ color: '#42526E' }}>
              Add specific courts within{"\n"}your facilities
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
                      <Text className="text-lg font-semibold mb-1" style={{ color: '#0B1220' }}>
                        {court.label}
                      </Text>
                      <Text className="text-sm" style={{ color: '#42526E' }}>
                        {facility?.name} • {area?.name}
                      </Text>
                      {court.sport && (
                        <Text className="text-sm mt-1" style={{ color: '#42526E' }}>
                          {court.sport}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleDelete(court)}
                      className="p-2 active:bg-gray-200 rounded-lg"
                    >
                      <Ionicons name="trash-outline" size={20} color="#C62828" />
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
          style={{ backgroundColor: '#1E88E5', minHeight: 44 }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-base font-medium text-white ml-2">
              Add Court
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
              id: `court_${Date.now()}`,
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
      Alert.alert('Missing Name', 'Please enter an area name.');
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
            <Text className="text-base" style={{ color: '#1E88E5' }}>Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
            {area ? 'Edit Area' : 'Add Area'}
          </Text>
          <Pressable onPress={handleSave}>
            <Text className="text-base font-medium" style={{ color: '#1E88E5' }}>Save</Text>
          </Pressable>
        </View>

        <View className="p-4">
          <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
            Area Name *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
            placeholder="Downtown, Northside, etc."
            style={{ color: '#0B1220' }}
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
      Alert.alert('Missing Information', 'Please enter a facility name and select an area.');
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
            <Text className="text-base" style={{ color: '#1E88E5' }}>Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
            {facility ? 'Edit Facility' : 'Add Facility'}
          </Text>
          <Pressable onPress={handleSave}>
            <Text className="text-base font-medium" style={{ color: '#1E88E5' }}>Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Area *
              </Text>
              <View className="bg-gray-50 rounded-lg border border-gray-200">
                {areas.map((area) => (
                  <Pressable
                    key={area.id}
                    onPress={() => setAreaId(area.id)}
                    className="px-3 py-3 flex-row items-center"
                    style={{
                      borderBottomWidth: areas.indexOf(area) < areas.length - 1 ? 1 : 0,
                      borderBottomColor: '#E0E0E0',
                    }}
                  >
                    <Ionicons
                      name={areaId === area.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color="#1E88E5"
                    />
                    <Text className="text-base ml-3" style={{ color: '#0B1220' }}>
                      {area.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Facility Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="Pro Club, Tennis Center, etc."
                style={{ color: '#0B1220' }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Address (Optional)
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="123 Main St, City, State"
                style={{ color: '#0B1220' }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Notes (Optional)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="Parking info, special instructions, etc."
                style={{ color: '#0B1220', textAlignVertical: 'top' }}
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
      Alert.alert('Missing Information', 'Please enter a court label and select a facility.');
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
            <Text className="text-base" style={{ color: '#1E88E5' }}>Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: '#0B1220' }}>
            {court ? 'Edit Court' : 'Add Court'}
          </Text>
          <Pressable onPress={handleSave}>
            <Text className="text-base font-medium" style={{ color: '#1E88E5' }}>Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Facility *
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
                        borderBottomColor: '#E0E0E0',
                      }}
                    >
                      <Ionicons
                        name={facilityId === facility.id ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color="#1E88E5"
                      />
                      <View className="ml-3">
                        <Text className="text-base" style={{ color: '#0B1220' }}>
                          {facility.name}
                        </Text>
                        <Text className="text-sm" style={{ color: '#42526E' }}>
                          {area?.name}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Court Label *
              </Text>
              <TextInput
                value={label}
                onChangeText={setLabel}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="Court 1, Center Court, etc."
                style={{ color: '#0B1220' }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: '#0B1220' }}>
                Sport (Optional)
              </Text>
              <TextInput
                value={sport}
                onChangeText={setSport}
                className="bg-gray-50 rounded-lg px-3 py-3 text-base border border-gray-200"
                placeholder="Tennis, Pickleball, etc."
                style={{ color: '#0B1220' }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}