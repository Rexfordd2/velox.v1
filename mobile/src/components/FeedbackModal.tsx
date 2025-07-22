import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useAnalytics } from '../lib/analytics';

interface FeedbackModalProps {
  isVisible: boolean;
  onClose: () => void;
  context?: Record<string, any>;
}

export function FeedbackModal({ isVisible, onClose, context }: FeedbackModalProps) {
  const analytics = useAnalytics();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await analytics.trackFeedback({
        type: feedbackType,
        message: message.trim(),
        context: {
          screen: context?.screen,
          action: context?.action,
          platform: Platform.OS,
          version: Platform.Version,
        },
      });
      setMessage('');
      onClose();
    } catch (error) {
      analytics.trackError({
        error: error as Error,
        context: { component: 'FeedbackModal' },
        isCritical: false,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Help Us Improve</Text>
          
          <View style={styles.typeContainer}>
            {(['bug', 'feature', 'general'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  feedbackType === type && styles.typeButtonActive,
                ]}
                onPress={() => setFeedbackType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    feedbackType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type === 'bug' ? 'Report Issue' :
                   type === 'feature' ? 'Suggestion' : 'Feedback'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder={
              feedbackType === 'bug' ? "What's not working right?" :
              feedbackType === 'feature' ? "What would make this better?" :
              "What's on your mind?"
            }
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
            editable={!isSending}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSending}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (!message.trim() || isSending) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!message.trim() || isSending}
            >
              <Text style={styles.buttonText}>
                {isSending ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
  },
}); 