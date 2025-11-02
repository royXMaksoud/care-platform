import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:animate_do/animate_do.dart';
import 'package:audioplayers/audioplayers.dart';

import '../core/theme/app_colors.dart';
import '../modules/home/home_controller.dart';

class VoiceAssistantWidget extends StatefulWidget {
  const VoiceAssistantWidget({super.key});

  @override
  State<VoiceAssistantWidget> createState() => _VoiceAssistantWidgetState();
}

class _VoiceAssistantWidgetState extends State<VoiceAssistantWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  final AudioPlayer _audioPlayer = AudioPlayer();
  final RxBool isSpeaking = false.obs;

  @override
  void initState() {
    super.initState();

    // Animation for pulse effect
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    // Initialize audio player
    _initAudio();
  }

  void _initAudio() {
    _audioPlayer.onPlayerComplete.listen((event) {
      print('✅ Voice Assistant audio completed');
      isSpeaking.value = false;
    });
    print('✅ Voice Assistant audio player initialized');
  }

  Future<void> _speakWelcome() async {
    try {
      if (isSpeaking.value) {
        await _audioPlayer.stop();
        isSpeaking.value = false;
        return;
      }

      print('🎤 Voice Assistant starting to play audio...');
      isSpeaking.value = true;

      await _audioPlayer.play(AssetSource('audio/welcome_ar.mp3'));
      print('🔊 Voice Assistant audio playing...');
    } catch (e) {
      print('❌ Audio Play Error: $e');
      Get.snackbar(
        'خطأ',
        'تعذر تشغيل الصوت',
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 2),
      );
      isSpeaking.value = false;
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 20.h,
      right: 20.w,
      child: ZoomIn(
        child: Obx(() => GestureDetector(
              onTap: _speakWelcome,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 90.w,
                height: 90.w,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: isSpeaking.value
                        ? [
                            const Color(0xFF4A90E2),
                            const Color(0xFF50E3C2),
                            const Color(0xFFFF6B9D),
                          ]
                        : [
                            const Color(0xFF4A90E2),
                            const Color(0xFF50E3C2),
                          ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: isSpeaking.value
                          ? AppColors.secondary.withOpacity(0.6)
                          : AppColors.primary.withOpacity(0.4),
                      blurRadius: isSpeaking.value ? 30 : 20,
                      spreadRadius: isSpeaking.value ? 8 : 5,
                    ),
                  ],
                ),
                child: Stack(
                  children: [
                    // Pulse animation
                    if (!isSpeaking.value)
                      AnimatedBuilder(
                        animation: _animationController,
                        builder: (context, child) {
                          return Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white.withOpacity(
                                  0.5 * _animationController.value,
                                ),
                                width: 3,
                              ),
                            ),
                          );
                        },
                      ),

                    // Bird icon
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isSpeaking.value
                                ? Icons.record_voice_over
                                : Icons.smart_toy_outlined,
                            size: isSpeaking.value ? 40.sp : 35.sp,
                            color: Colors.white,
                          ),
                          if (!isSpeaking.value)
                            Text(
                              '🐦',
                              style: TextStyle(fontSize: 22.sp),
                            ),
                        ],
                      ),
                    ),

                    // Close button
                    Positioned(
                      top: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: () {
                          _audioPlayer.stop();
                          Get.find<HomeController>().hideAssistant();
                        },
                        child: Container(
                          width: 26.w,
                          height: 26.w,
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.close,
                            size: 16.sp,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )),
      ),
    );
  }
}
