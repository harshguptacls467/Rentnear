import OneSignal from 'react-onesignal';

export const initOneSignal = async (userId) => {
  try {
    // Provided OneSignal App ID
    await OneSignal.init({
      appId: "109c1bae-e0a1-4b1c-a781-53f1ab90e9ec",
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
