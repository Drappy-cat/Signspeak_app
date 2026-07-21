import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Delete, X } from 'lucide-react-native';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin?: string;
}

export default function PinModal({ visible, onClose, onSuccess, expectedPin = '123456' }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  
  // Animation for shaking on error
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  // Entrance animation
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorMsg('');
      setFailedAttempts(0);
      
      // Trigger entrance animation
      slideAnim.setValue(100);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.poly(4)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  // Handle auto-verify when 6 digits are entered
  useEffect(() => {
    if (pin.length === 6) {
      verifyPin();
    }
  }, [pin]);

  const triggerShake = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, easing: Easing.linear, useNativeDriver: true })
    ]).start();
  };

  const verifyPin = () => {
    if (pin === expectedPin) {
      setErrorMsg('');
      setFailedAttempts(0);
      onSuccess();
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 4) {
        setErrorMsg('Akses diblokir. Hubungi lentera.apps@gmail.com');
      } else {
        setErrorMsg(`PIN salah. Sisa percobaan: ${4 - newAttempts}`);
      }
      
      triggerShake();
      setPin(''); // Reset immediately
    }
  };

  const handlePressNumber = (num: string) => {
    if (failedAttempts >= 4) return; // Block input
    
    if (pin.length < 6) {
      // Hanya hilangkan error jika belum diblokir sepenuhnya
      if (errorMsg && failedAttempts < 4) setErrorMsg('');
      setPin(prev => prev + num);
    }
  };

  const handlePressDelete = () => {
    if (failedAttempts >= 4) return; // Block input
    
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  // Render the 6 boxes
  const renderPinBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const isFilled = i < pin.length;
      boxes.push(
        <View key={i} style={[styles.pinBox, isFilled && styles.pinBoxFilled]}>
          {isFilled && <View style={styles.pinDot} />}
        </View>
      );
    }
    return (
      <Animated.View style={[styles.boxesContainer, { transform: [{ translateX: shakeAnimation }] }]}>
        {boxes}
      </Animated.View>
    );
  };

  // Custom Keypad
  const renderKeypadRow = (numbers: string[]) => (
    <View style={styles.keypadRow}>
      {numbers.map((num, idx) => (
        <TouchableOpacity 
          key={idx} 
          style={styles.keypadButton}
          onPress={() => num === 'del' ? handlePressDelete() : (num !== '' && handlePressNumber(num))}
          activeOpacity={0.7}
        >
          {num === 'del' ? (
            <View style={styles.delButtonIcon}>
              <Delete size={28} color="#ffffff" />
            </View>
          ) : num !== '' ? (
            <Text style={styles.keypadText}>{num}</Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!visible) return null;

  return (
    <Animated.View style={[
      StyleSheet.absoluteFill, 
      { 
        zIndex: 100, 
        elevation: 10,
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <LinearGradient 
        colors={['#4338ca', '#312e81']} 
        style={styles.container}
      >
        {/* Close button at top right */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={28} color="#ffffff" opacity={0.6} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>LENTERA</Text>
          <Text style={styles.subtitle}>Verifikasi 6-Digit PIN Keamanan</Text>

          {renderPinBoxes()}

          <View style={{ height: 24, justifyContent: 'center' }}>
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>Butuh PIN? Hubungi email:</Text>
            <Text style={styles.helpEmail}>lentera.apps@gmail.com</Text>
          </View>
        </View>

        <View style={styles.keypadContainer}>
          {renderKeypadRow(['1', '2', '3'])}
          {renderKeypadRow(['4', '5', '6'])}
          {renderKeypadRow(['7', '8', '9'])}
          {renderKeypadRow(['', '0', 'del'])}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginBottom: 40,
    fontWeight: '600',
  },
  boxesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pinBox: {
    width: 44,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pinBoxFilled: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#312e81',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  helpText: {
    color: '#a5b4fc',
    fontSize: 13,
  },
  helpEmail: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  keypadContainer: {
    paddingHorizontal: 30,
    paddingBottom: 20,
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '400',
  },
  delButtonIcon: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
