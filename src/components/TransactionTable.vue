<template>
  <table class="table">
    <thead>
      <tr>
        <th colspan="2">Transaction</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>To</th>
        <th>{{ transaction.to }}</th>
      </tr>
      <tr>
        <th>Amount</th>
        <th>{{ transaction.value }} {{ currencySymbol }}</th>
      </tr>
      <tr>
        <th>Gas price</th>
        <th>{{ transaction.gasPrice }} GWEI</th>
      </tr>
      <tr>
        <th>Gas limit</th>
        <th>{{ transaction.gasLimit }}</th>
      </tr>
      <tr>
        <th>Data</th>
        <th>{{ transaction.data }}</th>
      </tr>
    </tbody>
  </table>
</template>

<script>
import { get } from 'lodash';

export default {
  name: 'TransactionTable',

  props: {
    transaction: {
      type: Object,
      required: true,
    },

    currency: {
      type: Object,
      required: true,
    },
  },

  computed: {
    currencySymbol() {
      const { transaction, currency } = this;

      return get(transaction, 'token.symbol', currency.name);
    },
  },
};
</script>
