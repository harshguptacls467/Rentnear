import OneSignal from 'react-onesignal';

export const initOneSignal = async (userId) => {
  try {
    // Replace with your actual OneSignal App ID
    await OneSignal.init({
      appId: "00000000-0000-0000-0000-000000000000", // Placeholder App ID
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: true,
      },
    });

    if (userId) {
      OneSignal.login(userId);
    }
  } catch (err) {
    console.error('OneSignal Init Error:', err);
  }
};

export const setOneSignalUser = (userId) => {
  try {
    if (userId) {
      OneSignal.login(userId);
    } else {
      OneSignal.logout();
    }
  } catch (err) {
    console.error('OneSignal User Sync Error:', err);
  }
};
