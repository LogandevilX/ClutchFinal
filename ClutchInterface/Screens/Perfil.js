import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { actualizarUsuario } from '../services/authService';

const backgroundImage = require('../assets/Fondo_Inicio.png');
const appLogo = require('../assets/LogoClutch.png');

const formatRegisterDate = (dateValue) => {
  if (!dateValue) {
    return 'No disponible';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'No disponible';
  }

  return date.toLocaleDateString('es-ES');
};

export default function PerfilScreen({ user, onUserUpdate, onGoHome }) {
  const [editingField, setEditingField] = useState(null);
  const [savingField, setSavingField] = useState(null);
  const [apodoDraft, setApodoDraft] = useState(user?.apodo || '');
  const [emailDraft, setEmailDraft] = useState(user?.email || '');

  useEffect(() => {
    setApodoDraft(user?.apodo || '');
    setEmailDraft(user?.email || '');
  }, [user?.apodo, user?.email]);

  const updateProfileField = async (fieldName) => {
    if (!user?.id || !user) {
      Alert.alert('Error', 'No se pudo identificar el usuario.');
      return;
    }

    const nextApodo = fieldName === 'apodo' ? apodoDraft.trim() : (user.apodo || '').trim();
    const nextEmail = fieldName === 'email' ? emailDraft.trim() : (user.email || '').trim();

    if (!nextApodo || !nextEmail) {
      Alert.alert('Campos inválidos', 'El apodo y el correo son obligatorios.');
      return;
    }

    if (!nextEmail.includes('@')) {
      Alert.alert('Correo inválido', 'Introduce un correo electrónico válido.');
      return;
    }

    setSavingField(fieldName);

    try {
      const response = await actualizarUsuario(user.id, {
        apodo: nextApodo,
        email: nextEmail,
        password: user.password,
        rol: user.rol,
        fechaRegistro: user.fechaRegistro,
      });

      if (!response.ok || !response.data) {
        Alert.alert('No se pudo actualizar', 'Revisa los datos e inténtalo de nuevo.');
        return;
      }

      onUserUpdate?.(response.data);
      setEditingField(null);
      Alert.alert('Perfil actualizado', 'Tus datos se han guardado correctamente.');
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con la API.');
    } finally {
      setSavingField(null);
    }
  };

  const renderEditableRow = ({ label, value, field }) => {
    const isEditing = editingField === field;
    const isSaving = savingField === field;

    return (
      <View style={styles.profileRow}>
        <View style={styles.profileInfo}>
          <Text style={styles.profileLabel}>{label}</Text>
          {isEditing ? (
            <TextInput
              style={styles.profileInput}
              value={field === 'apodo' ? apodoDraft : emailDraft}
              onChangeText={field === 'apodo' ? setApodoDraft : setEmailDraft}
              autoCapitalize="none"
              keyboardType={field === 'email' ? 'email-address' : 'default'}
              placeholderTextColor="#666"
            />
          ) : (
            <Text style={styles.profileValue}>{value || 'No disponible'}</Text>
          )}
        </View>

        <Pressable
          style={styles.editButton}
          disabled={isSaving}
          onPress={() => {
            if (isEditing) {
              updateProfileField(field);
              return;
            }

            setEditingField(field);
          }}
        >
          <Text style={styles.editButtonText}>{isSaving ? '...' : isEditing ? 'Guardar' : 'Editar'}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 10}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.overlayCard}>
              <Pressable style={styles.backButton} onPress={onGoHome}>
                <Text style={styles.backText}>← Volver al inicio</Text>
              </Pressable>

              <View style={styles.logoCircle}>
                <Image source={appLogo} style={styles.logo} resizeMode="contain" />
              </View>

              <Text style={styles.title}>Hola, {user?.apodo || 'Usuario'}</Text>
              <Text style={styles.subtitle}>Información personal</Text>

              <View style={styles.formBlock}>
                {renderEditableRow({ label: 'Apodo', value: user?.apodo, field: 'apodo' })}
                {renderEditableRow({ label: 'Correo', value: user?.email, field: 'email' })}

                <View style={styles.profileRow}>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileLabel}>Fecha de registro</Text>
                    <Text style={styles.profileValue}>{formatRegisterDate(user?.fechaRegistro)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: 'rgba(7, 18, 35, 0.65)',
    borderRadius: 36,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 14,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#7E1F26',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  logoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  logo: {
    width: 170,
    height: 170,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 18,
  },
  formBlock: {
    width: '100%',
    alignItems: 'center',
  },
  profileRow: {
    width: '100%',
    minHeight: 74,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    color: '#555',
    fontSize: 14,
    marginBottom: 2,
    fontWeight: '700',
  },
  profileValue: {
    color: '#1A1A1A',
    fontSize: 22,
    fontWeight: '600',
  },
  profileInput: {
    color: '#1A1A1A',
    fontSize: 22,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 0,
  },
  editButton: {
    backgroundColor: '#7E1F26',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 92,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
