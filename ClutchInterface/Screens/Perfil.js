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

export default function PerfilScreen({ user, onUserUpdate, onGoHome, onLogout }) {
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
          hitSlop={10}
          onPress={() => {
            if (isEditing) {
              updateProfileField(field);
              return;
            }

            setEditingField(field);
          }}
        >
          <Text style={styles.editButtonText}>
            {isSaving ? '⏳' : isEditing ? '✅' : '✏️'}
          </Text>
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
                <Text style={styles.backButtonText}>❮</Text>
              </Pressable>

              <View style={styles.logoCircle}>
                <Image source={appLogo} style={styles.logo} resizeMode="contain" />
              </View>

              <Text style={styles.title}>Hola, {user?.apodo || 'Usuario'}</Text>
              <Text style={styles.subtitle}>Información personal</Text>

              <View style={styles.formBlock}>
                {renderEditableRow({ label: 'Apodo', value: user?.apodo, field: 'apodo' })}
                {renderEditableRow({ label: 'Correo', value: user?.email, field: 'email' })}
              </View>

              <Pressable style={styles.logoutButton} onPress={onLogout}>
                <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
              </Pressable>
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
    paddingTop: 24,
    paddingBottom: 30,
    height: '95%',
    width: '100%',
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(5, 15, 29, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  backButtonText: { color: '#fff', fontWeight: '900', fontSize: 26, lineHeight: 26, marginRight: 2 },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  logo: {
    width: 110,
    height: 110,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'left',
    marginBottom: 24,
    opacity: 0.9,
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
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    color: '#777',
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  profileValue: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
  },
  profileInput: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 2,
  },
  editButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 22,
  },
  logoutButton: {
    marginTop: 18,
    alignSelf: 'center',
    backgroundColor: '#7E1F26',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
