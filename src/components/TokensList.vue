<template>
  <div
    class="tokens-list"
    data-test="tokens-list"
  >
    <ul v-if="tokens.length > 0">
      <li
        v-for="token in tokens"
        :class="itemClass"
        :key="token.address"
        data-test="user-token"
      >
        <v-token
          :token="token"
          :currency="currency"
          :price="ethPrice"
        />
      </li>
    </ul>
    <p
      v-else
      class="small"
    >
      You have no tokens at this address.
    </p>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import error from '@/mixins/error';
import VToken from '@/components/VToken';

export default {
  props: {
    tokens: {
      type: Array,
      default: () => [],
    },

    hasRemove: {
      type: Boolean,
      default: false,
    },

    itemClass: {
      type: [Object, Array, String],
      default: '',
    },
  },

  computed: {
    ...mapGetters('tokens', ['currentNetUserFullTokens']),
    ...mapState({
      ethPrice: state => state.price.price,
      currency: state => state.user.settings.fiatCurrency,
      userTokens: state => state.tokens.userTokens,
    }),
  },

  mixins: [error],

  components: {
    VToken,
  },
};
</script>

<style lang="scss">
</style>
