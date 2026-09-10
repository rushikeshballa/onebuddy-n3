import React, { useEffect } from 'react';
import { BackHandler, Modal } from 'react-native';
import { ServicePreferencesScreen } from '../native/screens/ServicePreferences';

interface ServicePreferencesHostProps {
  visible: boolean;
  onClose: () => void;
}

export default function ServicePreferencesHost({
  visible,
  onClose,
}: ServicePreferencesHostProps): React.JSX.Element {
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <ServicePreferencesScreen onBack={onClose} />
    </Modal>
  );
}
