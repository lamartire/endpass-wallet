import axios from 'axios';
import { NotificationError } from '@/class';
import { identityAPIUrl } from '@/config';

export default {
  login(email) {
    return Promise.resolve({
      success: true,
      // success: false,
      challenge: {
        challenge_type: 'email_link',
        // challenge_type: 'otp',
      },
    })
      .then(({ success, challenge }) => {
        if (!success) {
          return Promise.reject();
        }

        return challenge.challenge_type;
      })
      .catch(() => {
        throw new NotificationError({
          title: 'Auth error',
          text: 'Invalid or missing email address. Please, try again',
          type: 'is-danger',
        });
      });
  },

  loginViaOTP(code) {
    return Promise.resolve({
      success: true,
      // success: false,
    })
      .then(({ success }) => {
        if (!success) {
          return Promise.reject();
        }
      })
      .catch(() => {
        throw new NotificationError({
          title: 'Auth error',
          text: 'Invalid or missing one time password. Please, try again',
          type: 'is-danger',
        });
      });
  },

  getSettings() {
    return Promise.resolve({});
  },

  setSettings(settings) {
    return Promise.resolve({
      success: true,
    });
  },

  removeSettings(propsArr) {
    return Promise.resolve({
      success: true,
    });
  },

  getAccounts() {
    return Promise.resolve([]);
  },

  setAccount(account) {
    return Promise.resolve({
      success: true,
    });
  },

  getAccount(account) {
    return Promise.reject().catch(() => {
      const shortAcc = account.replace(/^(.{5}).+/, '$1…');

      throw new NotificationError({
        title: 'Account request error',
        text: `Failed to get account ${shortAcc}. Please, reload page`,
        type: 'is-danger',
      });
    });
  },

  getV3Accounts() {
    return Promise.resolve([]);
  },

  getFullUserInfo() {
    return Promise.all([this.getSettings(), this.getV3Accounts()])
      .then(([settings, accounts]) => ({
        accounts,
        ...settings,
      }))
      .catch(() => {});
  },

  getOtpSettings() {
    return Promise.resolve({
      secret: 'AABC',
      // status: 'enabled',
    });

    // return Promise.reject().catch(() => {
    //   throw new NotificationError({
    //     title: 'Error requesting two-factor authentication settings',
    //     text: `Failed to get OTP settings.`,
    //     type: 'is-danger',
    //   });
    // });
  },

  setOtpSettings(secret, code) {
    return Promise.resolve({
      data: {
        success: true,
        // success: false,
        // message: 'server message'
      },
    })
      .then(({ data }) => {
        if (!data.success) {
          console.warn(`POST ${identityAPIUrl}/otp: ${data.message}`);
          return Promise.reject();
        }

        return data;
      })
      .catch(() => {
        throw new NotificationError({
          title: 'Error saving two-factor authentication settings',
          text: `Failed to save OTP settings.`,
          type: 'is-danger',
        });
      });

    // return Promise.reject().catch(() => {
    //   throw new NotificationError({
    //     title: 'Error saving two-factor authentication settings',
    //     text: `Failed to save OTP settings.`,
    //     type: 'is-danger',
    //   });
    // });
  },

  deleteOtpSettings(code) {
    return Promise.resolve({
      data: {
        success: true,
        // success: false,
        // message: 'server message'
      },
    })
      .then(({ data }) => {
        if (!data.success) {
          console.warn(`DELETE ${identityAPIUrl}/otp: ${data.message}`);
          return Promise.reject();
        }

        return data;
      })
      .catch(() => {
        throw new NotificationError({
          title: 'Error removing two-factor authentication settings',
          text: `Failed to remove OTP settings.`,
          type: 'is-danger',
        });
      });

    // return Promise.reject().catch(() => {
    //   throw new NotificationError({
    //     title: 'Error removing two-factor authentication settings',
    //     text: `Failed to remove OTP settings.`,
    //     type: 'is-danger',
    //   });
    // });
  },
};

// export default {
//   login(email) {
//     // return axios
//     //   .post(`${identityAPIUrl}/auth`, {
//     //     email,
//     //   })
//     //   .then(console.log)
//     //   .catch(console.log);

//     const error = new NotificationError({
//       title: 'Auth error',
//       text: 'Invalid or missing email address. Please, try again',
//       type: 'is-danger',
//     });

//     return Promise.resolve({
//       success: true,
//       challenge: {
//         challenge_type: 'email_link',
//       },
//     })
//       .then(({ success, challenge }) => {
//         if (!success) {
//           throw error;
//         }

//         return challenge.challenge_type;
//       })
//       .catch(() => {
//         throw error;
//       });
//   },

// loginViaOTP(code) {
//   return axios
//     .post(`${identityAPIUrl}/token`, {
//       challenge_type: 'otp',
//       code
//     }).then(({ success }) => {
//       if (!success) {
//         return Promise.reject();
//       }
//     })
//     .catch(() => {
//       throw new NotificationError({
//         title: 'Auth error',
//         text: 'Invalid or missing one time password. Please, try again',
//         type: 'is-danger',
//       });
//     });
// },

//   getSettings() {
//     // return axios
//     //   .get(`${identityAPIUrl}/user`)
//     //   .then(res => res.data)
//     //   .then(console.log)
//     //   .catch(console.log);

//     return Promise.resolve({
//       id: 'abcd-1234',
//       email: 'user@example.com',
//       net: 3,
//       networks: [
//         {
//           id: 5,
//           name: 'asdfa',
//           url:
//             'https://mail.yandexru/?msid=1526891347.96404.20950.49223&m_pssp=domik',
//         },
//       ],
//       settings: {
//         currency: 'USD',
//       },
//       tokens: {
//         '3': [
//           {
//             address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
//             decimals: 18,
//             logo: '/img/0xe41d2489571d322189246dafa5ebde1f4699f498.png',
//             manuallyAdded: true,
//             name: '0x Project',
//             symbol: 'ZRX',
//           },
//         ],
//       },
//     }).catch(() => {
//       throw new NotificationError({
//         title: 'User request error',
//         text: 'Failed to get user information. Please, reload page',
//         type: 'is-danger',
//       });
//     });
//   },

//   setSettings(settings) {
//     // return axios
//     //   .post(`${identityAPIUrl}/user`, settings)
//     //   .then(res => res.data)
//     //   .then(console.log)
//     //   .catch(console.log);

//     return Promise.resolve({
//       success: true,
//     });
//   },

//   removeSettings(propsArr) {
//     // return axios
//     //   .delete(`${identityAPIUrl}/user`, propsArr)
//     //   .then(res => res.data)
//     //   .then(console.log)
//     //   .catch(console.log);

//     return Promise.resolve({
//       success: true,
//     });
//   },

//   getAccounts() {
//     // return axios
//     //   .get(`${identityAPIUrl}/accounts`)
//     //   .then(res => res.data)
//     //   .then(console.log)
//     //   .catch(console.log);

//     return Promise.resolve([
//       '0x9eceefdf3554e178a6549006f2c02163e63c9fd8',
//     ]).catch(() => {
//       throw new NotificationError({
//         title: 'Accounts request error',
//         text: 'Failed to get user accounts. Please, reload page',
//         type: 'is-danger',
//       });
//     });
//   },

//   setAccount(account) {
//     // return axios
//     //   .post(`${identityAPIUrl}/accounts`, account)
//     //   .then(res => res.data)
//     //   .then(console.log)
//     //   .catch(console.log);

//     return Promise.resolve({
//       success: true,
//     });
//   },

//   getAccount(account) {
//     // return axios
//     //   .get(`${identityAPIUrl}/account/${account}`)
//     //   .then(res => res.data)
//     //   .then(console.log)
//     //   .catch(console.log);

//     return Promise.resolve({
//       version: 3,
//       id: '70534c78-ceb7-4e7e-b805-106504a880c9',
//       address: '9eceefdf3554e178a6549006f2c02163e63c9fd8',
//       crypto: {
//         ciphertext:
//           '73041b43d5952ab3177282b8c3df935b60c99c7fc13c77bc602d6be9b421ea2d',
//         cipherparams: { iv: 'acb168461a9850642c2b490cf4ed29eb' },
//         cipher: 'aes-128-ctr',
//         kdf: 'scrypt',
//         kdfparams: {
//           dklen: 32,
//           salt:
//             '14770d04f812b80db04b14e6d132e917ff2047aa814c3a9b103f7d4849a48a2c',
//           n: 262144,
//           r: 8,
//           p: 1,
//         },
//         mac: '4543eebe2f1ca245547be1bba36b7107f13b8e44ef166c7bf7452b4a4461ed4e',
//       },
//     }).catch(() => {
//       const shortAcc = account.replace(/^(.{5}).+/, '$1…');

//       throw new NotificationError({
//         title: 'Account request error',
//         text: `Failed to get account ${shortAcc}. Please, reload page`,
//         type: 'is-danger',
//       });
//     });
//   },

//   getV3Accounts() {
//     // return this.getAccounts()
//     //   .then(accounts => {
//     //     const allAcc = accounts.map(this.getAccount);
//     //     return Promise.all(allAcc);
//     //   })
//     //   .catch(console.log);

//     return Promise.resolve(['0x9eceefdf3554e178a6549006f2c02163e63c9fd8'])
//       .then(accounts => {
//         const allAcc = accounts.map(this.getAccount);
//         return Promise.all(allAcc);
//       })
//       .catch(() => {
//         throw new NotificationError({
//           title: 'Accounts request error',
//           text: 'Failed to get user accounts. Please, reload page',
//           type: 'is-danger',
//         });
//       });
//   },

//   getFullUserInfo() {
//     return Promise.all([this.getSettings(), this.getV3Accounts()])
//       .then(([settings, accounts]) => ({
//         accounts,
//         ...settings,
//       }))
//       .catch(() => {});
//   },

//   getOtpSettings() {
//     return axios
//       .get(`${identityAPIUrl}/otp`)
//       .then(res => res.data)
//       .catch(() => {
//         throw new NotificationError({
//           title: 'Error requesting two-factor authentication settings',
//           text: `Failed to get OTP settings.`,
//           type: 'is-danger',
//         });
//       });
//   },

//   setOtpSettings(secret, code) {
//     return axios
//       .post(`${identityAPIUrl}/otp`, { secret, code })
//       .then(({ data }) => {
//         if (!data.success) {
//           console.warn(`POST ${identityAPIUrl}/otp: ${data.message}`);
//           return Promise.reject();
//         }
//
//         return data;
//       }).catch(() => {
//         throw new NotificationError({
//           title: 'Error saving two-factor authentication settings',
//           text: `Failed to save OTP settings.`,
//           type: 'is-danger',
//         });
//       });
//   },
//   deleteOtpSettings(code) {
//     return axios
//       .delete(`${identityAPIUrl}/otp`, {
//         data: { code }
//       }).then(({ data }) => {
//         if (!data.success) {
//           console.warn(`DELETE ${identityAPIUrl}/otp: ${data.message}`);
//           return Promise.reject();
//         }
//
//         return data;
//       }).catch(() => {
//         throw new NotificationError({
//           title: 'Error removing two-factor authentication settings',
//           text: `Failed to remove OTP settings.`,
//           type: 'is-danger',
//         });
//       });
//   },
// };
