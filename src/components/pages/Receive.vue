<template>
  <div
    v-if="address"
    class="app-page receive-page"
  >
    <div class="section">
      <div class="container">
        <account-wallet-card
          :address="address"
          :active-currency-name="activeCurrency.name"
          :is-current-account="true"
          data-test="current-account"
        />
      </div>
    </div>

    <div class="section">
      <div class="container">
        <account-wallet-card
          v-for="(wallet, walletAddress) in wallets"
          v-if="walletAddress !== address"
          :key="walletAddress"
          :address="walletAddress"
          :active-currency-name="activeCurrency.name"
          :allow-send="!wallet.isPublic"
          :show-balance="true"
          data-test="account"
          @send="clickSendButton(walletAddress)"
        />
      </div>
    </div>

    <div class="section">
      <div class="container">
        <div class="card app-card">
          <div class="card-header">
            <h2 class="card-header-title">Incoming Payment History</h2>
          </div>
          <div class="card-content">
            <ul
              v-if="incomingTransactions.length"
              class="transactions"
            >
              <li
                v-for="transaction in incomingTransactions"
                :key="transaction.hash"
              >
                <app-transaction :transaction="transaction"/>
              </li>
            </ul>
            <v-spinner v-else-if="isLoading"/>
            <p v-else>This account has no transactions.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import VButton from '@/components/ui/form/VButton';
import AppTransaction from '@/components/Transaction';
import Account from '@/components/Account';
import VSpinner from '@/components/ui/VSpinner';
import AccountWalletCard from '@/components/AccountWalletCard';

export default {
  name: 'ReceivePage',

  data: () => ({
    isLoading: true,
  }),

  computed: {
    ...mapState({
      address: state => state.accounts.address,
      wallets: state => state.accounts.wallets,
      activeCurrency: state => state.web3.activeCurrency,
      activeNetId: state => state.web3.activeNet.id,
    }),
    ...mapGetters('accounts', ['wallet', 'isPublicAccount']),
    ...mapGetters('transactions', ['incomingTransactions']),
  },

  watch: {
    address: {
      handler() {
        this.getHistory();
      },
      immediate: true,
    },

    wallet: {
      handler() {
        this.updateTransactionHistory();
      },
      immediate: true,
    },
  },

  methods: {
    ...mapActions('transactions', ['updateTransactionHistory']),
    ...mapActions('accounts', ['selectWallet']),

    async clickSendButton(address) {
      this.selectWallet(address);
      this.$router.push('/send');
    },

    async getHistory() {
      if (!this.address) {
        this.isLoading = false;
        return;
      }

      try {
        this.isLoading = true;
        await this.updateTransactionHistory();
      } catch (err) {
        // TODO: does it need any actions to handle errors?
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
  },

  components: {
    Account,
    AppTransaction,
    VSpinner,
    VButton,
    AccountWalletCard,
  },
};
</script>

<style lang="scss">
.transactions {
  max-width: 700px;
}
</style>
