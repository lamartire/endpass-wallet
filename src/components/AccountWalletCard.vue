<template>
  <div class="card app-card">
    <div class="card-header">
      <h2 class="card-header-title">Receive ETH</h2>
    </div>
    <div
      class="card-content"
      data-test="current-account"
    >
      <div
        v-if="isCurrentAccount"
        class="card-section"
      >
        Your Active Address:
      </div>
      <div class="card-section">
        <account
          v-if="address"
          :currency="activeCurrencyName"
          :address="address"
          :show-balance="showBalance"
          :balance="balance"
        />
      </div>
      <div
        v-if="allowSend"
        class="card-section"
      >
        <v-button
          type="button"
          name="button"
          data-test="send-button"
          @click="emitSend"
        >
          Send ethereum
        </v-button>
      </div>
      <div class="card-tokens">
        <v-spinner v-if="isLoading" />
        <tokens-list
          v-if="!isLoading"
          :tokens="tokens"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { get } from 'lodash';
import { mapActions } from 'vuex';
import Account from '@/components/Account';
import TokensList from '@/components/TokensList';
import VSpinner from '@/components/ui/VSpinner';
import VButton from '@/components/ui/form/VButton';

export default {
  name: 'AccountWalletCard',

  props: {
    isCurrentAccount: {
      type: Boolean,
      default: false,
    },

    address: {
      type: String,
      required: true,
    },

    activeCurrencyName: {
      type: String,
      required: true,
    },

    allowSend: {
      type: Boolean,
      default: false,
    },

    showBalance: {
      type: Boolean,
      default: false,
    },
  },

  data: () => ({
    balance: '0',
    tokens: [],
    isLoading: false,
  }),

  methods: {
    ...mapActions('accounts', ['getAccountBalanceByAddress']),

    async loadTokensData() {
      try {
        this.isLoading = true;

        const res = await this.getAccountBalanceByAddress(this.address);

        this.balance = get(res, 'balance', '0');
        this.tokens = get(res, 'tokens', []);
      } catch (err) {
        // TODO: does it need any actions to handle errors?
      } finally {
        this.isLoading = false;
      }
    },

    emitSend() {
      this.$emit('send');
    },
  },

  created() {
    this.loadTokensData();
  },

  components: {
    Account,
    TokensList,
    VSpinner,
    VButton,
  },
};
</script>

<style lang="scss" scoped>
.card-section {
  margin-bottom: 1rem;
}

.card-tokens {
  position: relative;
}
</style>
