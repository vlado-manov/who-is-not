// plugins/withCamScreenRecorder.js
const {
  AndroidConfig,
  withAndroidManifest,
  withMainActivity,
} = require("expo/config-plugins");

const SERVICE_NAME =
  "com.margelo.nitro.nitroscreenrecorder.ScreenRecordingService";

const PERMISSIONS = [
  "android.permission.RECORD_AUDIO",
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
  "android.permission.POST_NOTIFICATIONS",
];

const IMPORTS = [
  "import com.margelo.nitro.nitroscreenrecorder.NitroScreenRecorder",
  "import android.content.Intent",
];

const ON_ACTIVITY_RESULT = `
  // Cam Mode screen recording: hands the "record screen" consent result to the recorder.
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    NitroScreenRecorder.handleActivityResult(requestCode, resultCode, data)
  }
`;

/**
 * Native setup for Cam Mode screen recording (react-native-nitro-screen-recorder).
 *
 * The library ships its own plugin, but that one also adds an iOS Broadcast
 * Upload Extension and an App Group, needed only for system-wide recording.
 * Cam Mode records inside the app on iOS (ReplayKit, nothing to configure), so
 * this plugin applies just the Android part: the media-projection foreground
 * service, its permissions, and the activity-result hook in MainActivity.
 */
module.exports = function withCamScreenRecorder(config) {
  config = AndroidConfig.Permissions.withPermissions(config, PERMISSIONS);

  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error("withCamScreenRecorder: <application> not found");
    }
    application.service = application.service ?? [];
    const exists = application.service.some(
      (service) => service.$?.["android:name"] === SERVICE_NAME,
    );
    if (!exists) {
      application.service.push({
        $: {
          "android:name": SERVICE_NAME,
          "android:enabled": "true",
          "android:exported": "false",
          "android:foregroundServiceType": "mediaProjection",
        },
      });
    }
    return mod;
  });

  return withMainActivity(config, (mod) => {
    if (mod.modResults.language !== "kt") {
      throw new Error("withCamScreenRecorder: expected a Kotlin MainActivity");
    }
    let contents = mod.modResults.contents;
    if (contents.includes("NitroScreenRecorder.handleActivityResult")) return mod;
    if (contents.includes("fun onActivityResult")) {
      throw new Error(
        "withCamScreenRecorder: MainActivity already overrides onActivityResult; add NitroScreenRecorder.handleActivityResult there by hand",
      );
    }

    for (const line of IMPORTS) {
      if (!contents.includes(line)) {
        contents = contents.replace(/^(package .*\n)/m, `$1\n${line}`);
      }
    }
    const classEnd = contents.lastIndexOf("}");
    contents =
      contents.slice(0, classEnd) + ON_ACTIVITY_RESULT + contents.slice(classEnd);
    mod.modResults.contents = contents;
    return mod;
  });
};
