import 'package:audioplayers/audioplayers.dart';
import 'package:get/get.dart';
import '../../routes/app_routes.dart';

class WelcomeController extends GetxController {
  final AudioPlayer _audioPlayer = AudioPlayer();
  final RxBool isSpeaking = false.obs;
  final RxBool isBirdAnimating = false.obs;

  @override
  void onInit() {
    super.onInit();
    _initAudio();
  }

  void _initAudio() {
    // Listen for audio completion
    _audioPlayer.onPlayerComplete.listen((event) {
      print('✅ Audio completed');
      isSpeaking.value = false;
      isBirdAnimating.value = false;
    });

    print('✅ Audio player initialized');
  }

  Future<void> speakWelcome() async {
    try {
      if (isSpeaking.value) {
        await _audioPlayer.stop();
        isSpeaking.value = false;
        isBirdAnimating.value = false;
        return;
      }

      print('🎤 Starting to play audio...');
      isSpeaking.value = true;
      isBirdAnimating.value = true;

      // Play audio file from assets
      await _audioPlayer.play(AssetSource('audio/welcome_ar.mp3'));

      print('🔊 Audio playing...');
    } catch (e) {
      print('❌ Audio Play Error: $e');
      Get.snackbar(
        'خطأ',
        'تعذر تشغيل الصوت. تأكد من وجود ملف الصوت.',
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 3),
      );
      isSpeaking.value = false;
      isBirdAnimating.value = false;
    }
  }

  void startApp() {
    _audioPlayer.stop();
    Get.offAllNamed(Routes.home);
  }

  void skipAndDisable() {
    _audioPlayer.stop();
    Get.offAllNamed(Routes.home);
  }

  @override
  void onClose() {
    _audioPlayer.dispose();
    super.onClose();
  }
}
