# Keep local authentication (biometrics) reflection classes
-keep class expo.modules.localauthentication.** { *; }
-keep class com.google.android.gms.biometric.** { *; }

# Keep react-native-maps & play services
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.android.android.gms.common.** { *; }

# Keep socket.io serialization & okhttp classes
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-keep class io.socket.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Keep shopify flash-list native metrics
-keep class com.shopify.reactnative.flash_list.** { *; }
