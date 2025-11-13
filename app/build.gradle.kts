plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
  namespace = "com.mahi.stepalarm"
  compileSdk = 34
  defaultConfig {
    applicationId = "com.mahi.stepalarm"
    minSdk = 24
    targetSdk = 34
    versionCode = 1
    versionName = "1.0"
  }
  buildFeatures { 
    viewBinding = false
    dataBinding = false
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
  }
}

// Ensure Kotlin compilation target matches Java compatibility
tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile::class.java).configureEach {
    kotlinOptions {
        jvmTarget = "1.8"
    }
}
dependencies {
  implementation("androidx.core:core-ktx:1.13.1")
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("com.google.android.material:material:1.12.0")
  implementation("androidx.activity:activity-ktx:1.9.2")
}