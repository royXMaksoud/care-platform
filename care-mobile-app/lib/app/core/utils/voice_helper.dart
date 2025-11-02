import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../core/i18n/translations_loader.dart';

/// Voice Helper for accessibility
/// 
/// Provides voice instructions for elderly and children users
class VoiceHelper {
  /// Play voice instructions
  static Future<void> speakInstruction(String key) async {
    // TODO: Implement TTS or play audio files
    // For now, just show text
    final message = TranslationsLoader.translate(key);
    Get.snackbar(
      '',
      message,
      duration: Duration(seconds: 3),
      snackPosition: SnackPosition.TOP,
      backgroundColor: Colors.blue.withOpacity(0.1),
      icon: Icon(Icons.volume_up, color: Colors.blue),
    );
  }

  /// Show help dialog with voice/text instructions
  static void showHelpDialog({
    required String titleKey,
    required String messageKey,
    String? voiceKey,
  }) {
    Get.dialog(
      AlertDialog(
        title: Row(
          children: [
            Icon(Icons.help_outline, color: Colors.blue),
            SizedBox(width: 8),
            Expanded(
              child: Text(TranslationsLoader.translate(titleKey)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(TranslationsLoader.translate(messageKey)),
            if (voiceKey != null) ...[
              SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => speakInstruction(voiceKey),
                icon: Icon(Icons.volume_up),
                label: Text('استمع للتعليمات'),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: Text(TranslationsLoader.translate('ok')),
          ),
        ],
      ),
    );
  }
}

